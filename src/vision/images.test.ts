import { attachmentFromBlob, importImageFiles } from './images';

const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6DkUAAAAASUVORK5CYII=';

function file(type = 'image/png'): File {
  return new File([Uint8Array.from(atob(PNG_1X1), (character) => character.charCodeAt(0))], 'chart.png', { type });
}

function encodedImage(width: number, height: number, mimeType = 'image/png'): Blob {
  if (mimeType === 'image/jpeg') {
    return new Blob(
      [new Uint8Array([255, 216, 255, 192, 0, 8, 8, height >> 8, height & 255, width >> 8, width & 255, 0, 255, 217])],
      { type: mimeType }
    );
  }
  const bytes = new Uint8Array(32);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return new Blob([bytes], { type: mimeType });
}

describe('image import', () => {
  const close = jest.fn();

  beforeEach(() => {
    Object.defineProperty(globalThis, 'createImageBitmap', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({ width: 1, height: 1, close }),
    });
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage: jest.fn() } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      type
    ) {
      callback(encodedImage(this.width, this.height, type));
    });
  });

  afterEach(() => {
    close.mockClear();
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'createImageBitmap');
  });

  test('rasterizes uploaded image pixels in memory and releases its decoded bitmap', async () => {
    const [image] = await importImageFiles([file()]);
    expect(image).toMatchObject({ name: 'chart.png', source: 'upload', mimeType: 'image/png', width: 1, height: 1 });
    expect(image.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('rejects SVG, mismatched types, excessive counts, and oversize files', async () => {
    await expect(importImageFiles([file('image/svg+xml')])).rejects.toThrow('PNG and JPEG');
    await expect(importImageFiles([file('image/jpeg')])).rejects.toThrow('does not match');
    await expect(importImageFiles(Array.from({ length: 9 }, () => file()))).rejects.toThrow('at most 8');
    await expect(
      importImageFiles([new File([new Uint8Array(4_194_305)], 'large.png', { type: 'image/png' })])
    ).rejects.toThrow('4 MiB');
  });

  test('rejects decompression-bomb dimensions before invoking the decoder', async () => {
    const bytes = new Uint8Array(
      await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(file());
      })
    );
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 20000);
    view.setUint32(20, 20000);
    await expect(attachmentFromBlob(new Blob([bytes], { type: 'image/png' }), 'Huge', 'upload')).rejects.toThrow(
      'too large'
    );
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  test('checks decoding even when dimensions are within limits', async () => {
    jest.mocked(createImageBitmap).mockRejectedValueOnce(new Error('Invalid image data'));
    await expect(importImageFiles([file()])).rejects.toThrow('Invalid image data');
  });

  test('bounds generated capture labels but still rejects invalid uploaded filenames', async () => {
    const longName = '界'.repeat(100) + '\nchart';
    const captured = await attachmentFromBlob(file(), longName, 'panel');
    expect(new Blob([captured.name]).size).toBeLessThanOrEqual(256);
    expect(captured.name.endsWith('…')).toBe(true);
    expect(captured.name).not.toContain('\n');
    await expect(attachmentFromBlob(file(), longName, 'upload')).rejects.toThrow('Image names');
  });

  test('strips nonvisual source metadata from every upload, even when it already fits the limits', async () => {
    const input = new File([file(), 'PRIVATE_GPS_METADATA'], 'location.png', { type: 'image/png' });
    const [image] = await importImageFiles([input]);
    expect(atob(image.dataUrl.split(',')[1])).not.toContain('PRIVATE_GPS_METADATA');
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
    expect(image.bytes).toBeLessThan(input.size);
  });

  test('re-encodes JPEG uploads without EXIF/GPS bytes and gives an explicit review warning', async () => {
    // A synthetic APP1 metadata segment followed by a supported JPEG size header.
    const input = new Uint8Array([
      255, 216, 255, 225, 0, 12, 69, 120, 105, 102, 0, 0, 71, 80, 83, 0, 255, 192, 0, 8, 8, 0, 1, 0, 1, 0, 255, 217,
    ]);
    const [image] = await importImageFiles([new File([input], 'location.jpg', { type: 'image/jpeg' })]);
    expect(image.mimeType).toBe('image/jpeg');
    expect(atob(image.dataUrl.split(',')[1])).not.toContain('Exif');
    expect(atob(image.dataUrl.split(',')[1])).not.toContain('GPS');
    expect(image.warnings).toContainEqual(expect.stringContaining('JPEG re-encoded'));
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('normalizes oversized dimensions with an explicit preview warning and releases the bitmap', async () => {
    const pngBytes = (width: number, height: number) => {
      const bytes = new Uint8Array(32);
      bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
      const view = new DataView(bytes.buffer);
      view.setUint32(16, width);
      view.setUint32(20, height);
      return bytes;
    };
    jest.mocked(createImageBitmap).mockResolvedValueOnce({ width: 5000, height: 10, close } as unknown as ImageBitmap);
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage: jest.fn() } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback) {
      callback(new Blob([pngBytes(this.width, this.height)], { type: 'image/png' }));
    });
    const [image] = await importImageFiles([new File([pngBytes(5000, 10)], 'wide.png', { type: 'image/png' })]);
    expect(image).toMatchObject({ width: 4096, height: 8 });
    expect(image.warnings).toContainEqual(expect.stringContaining('Check chart labels'));
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('an already cancelled import does not read or decode files', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(importImageFiles([file()], controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
});

import {
  boundedGeometry,
  captureImageName,
  readImageMetadata,
  validateVisionAttachments,
  VISION_LIMITS,
  waitForAbortable,
} from './limits';
import type { VisionAttachment } from './types';

function image(width = 400, height = 200, length = 32): VisionAttachment {
  const bytes = new Uint8Array(length);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return {
    id: 'test',
    name: 'Panel',
    dataUrl: `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`,
    mimeType: 'image/png',
    width,
    height,
    bytes: length,
    source: 'panel',
    capturedAt: new Date(0).toISOString(),
  };
}

describe('vision image limits', () => {
  test('bounds generated capture names by UTF-8 bytes without splitting Unicode characters', () => {
    for (const name of ['a'.repeat(256), '界'.repeat(85), '😀'.repeat(64)]) {
      expect(captureImageName(name)).toBe(name);
    }
    for (const name of ['a'.repeat(257), '界'.repeat(86), '😀'.repeat(65)]) {
      const label = captureImageName(name);
      expect(new Blob([label]).size).toBeLessThanOrEqual(256);
      expect(label.endsWith('…')).toBe(true);
      expect(label).not.toContain('\uFFFD');
      expect(() => validateVisionAttachments([{ ...image(), name: label }])).not.toThrow();
    }
    expect(captureImageName(' \tLine one\nLine two\u0000\u0085 ')).toBe('Line one Line two');
    expect(captureImageName('\n\u0000 ')).toBe('Panel snapshot');
  });

  test('accepts valid headers and exactly the supported pixel boundary', () => {
    expect(() => validateVisionAttachments([image(4000, 4000)])).not.toThrow();
    expect(() => validateVisionAttachments([image(4000, 4000), image(4000, 4000)])).not.toThrow();
    expect(VISION_LIMITS.maxImagePixels).toBe(16_000_000);
    expect(VISION_LIMITS.maxTotalImagePixels).toBe(32_000_000);
  });

  test('rejects extra attachments and aggregate decoded pixels', () => {
    expect(() => validateVisionAttachments(Array.from({ length: 9 }, () => image()))).toThrow('at most 8');
    expect(() => validateVisionAttachments([image(4000, 4000), image(4000, 4000), image(1, 1)])).toThrow('32 million');
  });

  test('rejects byte metadata mismatch, unsupported MIME types, and malformed base64', () => {
    expect(() => validateVisionAttachments([{ ...image(), bytes: 99 }])).toThrow('4 MiB');
    expect(() => validateVisionAttachments([{ ...image(), dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' }])).toThrow(
      'encoding'
    );
    expect(() => validateVisionAttachments([{ ...image(), dataUrl: 'data:image/png;base64,???=' }])).toThrow(
      'encoding'
    );
  });

  test('validates UTF-8 names against the backend limit before sending', () => {
    expect(() => validateVisionAttachments([{ ...image(), name: '界'.repeat(85) }])).not.toThrow();
    for (const name of ['界'.repeat(86), '', '  ', 'chart\nignore', 'chart\u0085']) {
      expect(() => validateVisionAttachments([{ ...image(), name }])).toThrow('Image names');
    }
  });

  test('rejects each image above 4 MiB and the total above 12 MiB', () => {
    expect(() => validateVisionAttachments([image(1, 1, VISION_LIMITS.maxImageBytes + 1)])).toThrow('4 MiB');
    const max = image(1, 1, VISION_LIMITS.maxImageBytes);
    expect(() => validateVisionAttachments([max, max, max, image(1, 1)])).toThrow('12 MiB');
  });

  test('rejects claimed dimensions that disagree with image bytes', () => {
    expect(() => validateVisionAttachments([{ ...image(), width: 1 }])).toThrow('metadata');
    expect(() => validateVisionAttachments([image(4097, 10)])).toThrow('4096');
    expect(() => validateVisionAttachments([image(4096, 4096)])).toThrow('16 million');
    expect(() => boundedGeometry(NaN, 10)).toThrow('dimensions');
    expect(() => boundedGeometry(0, 10)).toThrow('dimensions');
  });

  test('bounds both dimensions and the pixel area', () => {
    expect(boundedGeometry(8000, 2000)).toEqual({ width: 4096, height: 1024, scale: 0.512 });
    expect(boundedGeometry(4096, 4096)).toEqual({ width: 4000, height: 4000, scale: 4000 / 4096 });
  });

  test('recognizes JPEG dimensions and rejects truncated or non-image headers', () => {
    expect(readImageMetadata(new Uint8Array([255, 216, 255, 192, 0, 8, 8, 1, 44, 2, 88, 0]))).toEqual({
      mimeType: 'image/jpeg',
      width: 600,
      height: 300,
    });
    expect(() => readImageMetadata(new Uint8Array([255, 216, 255, 192, 0, 8]))).toThrow('PNG and JPEG');
    expect(() => readImageMetadata(new Uint8Array([60, 115, 118, 103]))).toThrow('PNG and JPEG');
  });

  test('cancellation rejects promptly even if a browser decoder never settles', async () => {
    const controller = new AbortController();
    const operation = waitForAbortable(new Promise<never>(() => undefined), controller.signal);
    controller.abort();
    await expect(operation).rejects.toMatchObject({ name: 'AbortError' });
  });
});

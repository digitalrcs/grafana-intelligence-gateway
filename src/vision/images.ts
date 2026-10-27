import {
  boundedGeometry,
  captureImageName,
  readImageMetadata,
  throwIfAborted,
  validateVisionAttachments,
  VISION_LIMITS,
  waitForAbortable,
} from './limits';
import type { VisionAttachment, VisionImageSource } from './types';

// Check compressed bytes and header dimensions before asking the browser to decode.
// Only one source image is decoded at a time and its bitmap is always released.
const MAX_SOURCE_PIXELS = 32_000_000;
const MAX_SOURCE_BYTES = 16_777_216;
let nextAttachmentId = 0;

export function readBlob(blob: Blob, signal?: AbortSignal): Promise<ArrayBuffer> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const onAbort = () => {
      reader.abort();
      cleanup();
      reject(new DOMException('Image preparation cancelled.', 'AbortError'));
    };
    reader.onload = () => {
      cleanup();
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error('The image could not be read.'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    reader.readAsArrayBuffer(blob);
  });
}

export function blobToDataUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const onAbort = () => {
      reader.abort();
      cleanup();
      reject(new DOMException('Image preparation cancelled.', 'AbortError'));
    };
    reader.onload = () => {
      cleanup();
      resolve(String(reader.result));
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error('The image preview could not be read.'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string, mimeType: VisionAttachment['mimeType']): Blob {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return new Blob([Uint8Array.from(binary, (character) => character.charCodeAt(0))], { type: mimeType });
}

export async function decodeImage(
  blob: Blob,
  signal?: AbortSignal
): Promise<{
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}> {
  throwIfAborted(signal);
  if (typeof createImageBitmap === 'function') {
    const pending = createImageBitmap(blob);
    pending.then(
      (bitmap) => {
        if (signal?.aborted) {
          bitmap.close();
        }
      },
      () => undefined
    );
    const bitmap = await waitForAbortable(pending, signal);
    return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  let released = false;
  const close = () => {
    if (!released) {
      released = true;
      URL.revokeObjectURL(url);
      image.src = '';
    }
  };
  try {
    await waitForAbortable(
      new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('The browser could not decode this image.'));
        image.src = url;
      }),
      signal
    );
    return { image, width: image.naturalWidth, height: image.naturalHeight, close };
  } catch (error) {
    close();
    throw error;
  }
}

export function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: VisionAttachment['mimeType'],
  signal?: AbortSignal
): Promise<Blob> {
  return waitForAbortable(
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob?.size) {
            reject(new Error('The browser returned an empty image. Canvas or WebGL content may be unreadable.'));
          } else {
            resolve(blob);
          }
        },
        mimeType,
        mimeType === 'image/jpeg' ? 0.9 : undefined
      );
    }),
    signal
  );
}

export async function attachmentFromBlob(
  blob: Blob,
  name: string,
  source: VisionImageSource,
  signal?: AbortSignal
): Promise<VisionAttachment> {
  throwIfAborted(signal);
  // A capture label is generated from dashboard content, not a user filename.
  // Normalize it before diagnostics and transport; uploaded names remain strict.
  if (source !== 'upload') {
    name = captureImageName(name);
  }
  if (blob.size === 0 || blob.size > MAX_SOURCE_BYTES) {
    throw new Error(`${name}: the source image exceeds the capture memory limit.`);
  }
  const metadata = readImageMetadata(new Uint8Array(await readBlob(blob, signal)));
  if (blob.type && blob.type !== metadata.mimeType) {
    throw new Error(`${name}: the file type does not match its image contents.`);
  }
  boundedGeometry(metadata.width, metadata.height);
  if (metadata.width * metadata.height > MAX_SOURCE_PIXELS || metadata.width > 32768 || metadata.height > 32768) {
    throw new Error(`${name}: the source image is too large to decode safely. Resize it before attaching it.`);
  }
  const warnings: string[] = [];
  let resultBlob = blob.type ? blob : new Blob([blob], { type: metadata.mimeType });
  let width = metadata.width;
  let height = metadata.height;
  const decoded = await decodeImage(blob, signal);
  try {
    const geometry = boundedGeometry(decoded.width, decoded.height);
    if (decoded.width * decoded.height > MAX_SOURCE_PIXELS) {
      throw new Error(`${name}: the decoded image exceeds the memory limit.`);
    }
    // Rasterize every upload so unpreviewable EXIF/GPS and other source metadata
    // never travel with the image. Canvas encoding contains only rendered pixels.
    if (
      geometry.scale < 1 ||
      blob.size > VISION_LIMITS.maxImageBytes ||
      decoded.width !== width ||
      decoded.height !== height ||
      source === 'upload'
    ) {
      const canvas = document.createElement('canvas');
      try {
        let target = geometry;
        for (let attempt = 0; attempt < 4; attempt++) {
          throwIfAborted(signal);
          canvas.width = target.width;
          canvas.height = target.height;
          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('This browser could not create an image canvas.');
          }
          context.drawImage(decoded.image, 0, 0, target.width, target.height);
          resultBlob = await encodeCanvas(canvas, metadata.mimeType, signal);
          width = target.width;
          height = target.height;
          if (resultBlob.size <= VISION_LIMITS.maxImageBytes) {
            break;
          }
          const nextScale = Math.min(0.8, Math.sqrt(VISION_LIMITS.maxImageBytes / resultBlob.size) * 0.95);
          target = {
            width: Math.max(1, Math.floor(width * nextScale)),
            height: Math.max(1, Math.floor(height * nextScale)),
            scale: nextScale,
          };
        }
        if (resultBlob.size > VISION_LIMITS.maxImageBytes) {
          throw new Error(`${name}: this image cannot fit within 4 MiB. Capture fewer panels or resize the image.`);
        }
        if (width !== metadata.width || height !== metadata.height || blob.size > VISION_LIMITS.maxImageBytes) {
          warnings.push(
            `${name} was prepared at ${width} × ${height} (source ${metadata.width} × ${metadata.height}) to fit image limits or orientation. Check chart labels in the preview before sending.`
          );
        }
        if (source === 'upload' && metadata.mimeType === 'image/jpeg') {
          warnings.push(
            `${name}: JPEG re-encoded to remove embedded metadata, including EXIF/GPS. Fine details may change; review the preview before sending.`
          );
        }
      } finally {
        canvas.width = 1;
        canvas.height = 1;
      }
    }
  } finally {
    decoded.close();
  }
  throwIfAborted(signal);
  const attachment: VisionAttachment = {
    id: `vision-${Date.now()}-${++nextAttachmentId}`,
    name,
    dataUrl: await blobToDataUrl(resultBlob, signal),
    mimeType: metadata.mimeType,
    width,
    height,
    bytes: resultBlob.size,
    source,
    capturedAt: new Date().toISOString(),
    ...(warnings.length ? { warnings } : {}),
  };
  validateVisionAttachments([attachment]);
  return attachment;
}

export async function importImageFiles(files: File[], signal?: AbortSignal): Promise<VisionAttachment[]> {
  throwIfAborted(signal);
  if (files.length > VISION_LIMITS.maxImages) {
    throw new Error('Attach at most 8 images per analysis.');
  }
  if (files.some((file) => file.size > VISION_LIMITS.maxImageBytes)) {
    throw new Error('Each uploaded image must be no larger than 4 MiB. Resize the file before attaching it.');
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > VISION_LIMITS.maxTotalImageBytes) {
    throw new Error('Uploaded files exceed the combined 12 MiB limit.');
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(
    () => controller.abort(new Error('Preparing images exceeded 30 seconds. Try fewer or smaller images.')),
    30_000
  );
  try {
    const attachments: VisionAttachment[] = [];
    for (const file of files) {
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        throw new Error(`${file.name}: only PNG and JPEG files are supported.`);
      }
      const attachment = await attachmentFromBlob(file, file.name, 'upload', controller.signal);
      if (attachment.mimeType !== file.type) {
        throw new Error(`${file.name}: the file type does not match its image contents.`);
      }
      attachments.push(attachment);
      validateVisionAttachments(attachments);
    }
    return attachments;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

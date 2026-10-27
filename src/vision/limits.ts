import type { VisionAttachment } from './types';

/** Keep these hard limits aligned with the companion data source's vision contract. */
export const VISION_LIMITS = Object.freeze({
  maxImageNameBytes: 256,
  maxImages: 8,
  maxImageBytes: 4_194_304,
  maxTotalImageBytes: 12_582_912,
  maxImageWidth: 4096,
  maxImageHeight: 4096,
  maxImagePixels: 16_000_000,
  maxTotalImagePixels: 32_000_000,
  maxRequestBytes: 18_874_368,
});

/** Bound generated capture labels without weakening validation for API inputs. */
export function captureImageName(value: string): string {
  const clean = Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || (code >= 127 && code <= 159) ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) {
    return 'Panel snapshot';
  }
  if (new Blob([clean]).size <= VISION_LIMITS.maxImageNameBytes) {
    return clean;
  }
  const suffix = '…';
  const budget = VISION_LIMITS.maxImageNameBytes - new Blob([suffix]).size;
  let prefix = '';
  let bytes = 0;
  for (const character of clean) {
    const size = new Blob([character]).size;
    if (bytes + size > budget) {
      break;
    }
    prefix += character;
    bytes += size;
  }
  return prefix.trimEnd() + suffix;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('Image preparation cancelled.', 'AbortError');
  }
}

export function waitForAbortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  if (!signal) {
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      reject(
        signal.reason instanceof Error ? signal.reason : new DOMException('Image preparation cancelled.', 'AbortError')
      );
    };
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      }
    );
  });
}

export function boundedGeometry(width: number, height: number): { width: number; height: number; scale: number } {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new Error('The image has invalid dimensions.');
  }
  const scale = Math.min(
    1,
    VISION_LIMITS.maxImageWidth / width,
    VISION_LIMITS.maxImageHeight / height,
    Math.sqrt(VISION_LIMITS.maxImagePixels / (width * height))
  );
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)), scale };
}

export function readImageMetadata(bytes: Uint8Array): {
  mimeType: VisionAttachment['mimeType'];
  width: number;
  height: number;
} {
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) &&
    bytes[12] === 73 &&
    bytes[13] === 72 &&
    bytes[14] === 68 &&
    bytes[15] === 82
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { mimeType: 'image/png', width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 0xff) {
        break;
      }
      while (bytes[offset] === 0xff) {
        offset++;
      }
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) {
        break;
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        continue;
      }
      const length = bytes[offset] * 256 + bytes[offset + 1];
      if (!Number.isFinite(length) || length < 2 || offset + length > bytes.length) {
        break;
      }
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) &&
        length >= 7
      ) {
        return {
          mimeType: 'image/jpeg',
          width: bytes[offset + 5] * 256 + bytes[offset + 6],
          height: bytes[offset + 3] * 256 + bytes[offset + 4],
        };
      }
      offset += length;
    }
  }
  throw new Error('Only valid PNG and JPEG images are supported.');
}

export function validateVisionAttachments(attachments: readonly VisionAttachment[]): void {
  if (attachments.length > VISION_LIMITS.maxImages) {
    throw new Error(`Attach at most ${VISION_LIMITS.maxImages} images per analysis.`);
  }
  let totalBytes = 0;
  let totalPixels = 0;
  for (const attachment of attachments) {
    if (
      !attachment.name.trim() ||
      new Blob([attachment.name.trim()]).size > VISION_LIMITS.maxImageNameBytes ||
      Array.from(attachment.name).some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || (code >= 127 && code <= 159);
      })
    ) {
      throw new Error('Image names must contain 1–256 UTF-8 bytes without control characters. Rename the image.');
    }
    const match = /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(attachment.dataUrl);
    if (!match || match[1] !== attachment.mimeType || match[2].length % 4 !== 0) {
      throw new Error(`${attachment.name}: the image encoding is invalid.`);
    }
    const bytes = (match[2].length / 4) * 3 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
    if (bytes < 1 || bytes > VISION_LIMITS.maxImageBytes || bytes !== attachment.bytes) {
      throw new Error(`${attachment.name}: each image must be no larger than 4 MiB.`);
    }
    const geometry = boundedGeometry(attachment.width, attachment.height);
    if (geometry.scale < 1) {
      throw new Error(`${attachment.name}: images must fit within 4096 × 4096 and 16 million pixels.`);
    }
    const binary = atob(match[2]);
    const metadata = readImageMetadata(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
    if (
      metadata.mimeType !== attachment.mimeType ||
      metadata.width !== attachment.width ||
      metadata.height !== attachment.height
    ) {
      throw new Error(`${attachment.name}: the image metadata does not match its contents.`);
    }
    totalBytes += bytes;
    totalPixels += attachment.width * attachment.height;
  }
  if (totalBytes > VISION_LIMITS.maxTotalImageBytes) {
    throw new Error('Attached images exceed the combined 12 MiB limit. Remove an image and try again.');
  }
  if (totalPixels > VISION_LIMITS.maxTotalImagePixels) {
    throw new Error('Attached images exceed the combined 32 million pixel limit. Remove an image and try again.');
  }
}

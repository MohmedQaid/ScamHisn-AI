import type { AllowedImageMime } from '@scamhisn/shared';

export interface CompressedImagePayload {
  previewDataUrl: string;
  imageBase64: string;
  mimeType: AllowedImageMime;
  fileName: string;
  originalKb: number;
  compressedKb: number;
  width: number;
  height: number;
}

const MAX_DIMENSION = 768;
const JPEG_QUALITY = 0.78;
const MAX_RAW_FILE_BYTES = 12 * 1024 * 1024; // 12 MB pre-compression limit

/**
 * Resizes & compresses an uploaded image client-side (max 768px, JPEG 0.78)
 * so every image fits into ONE single Gemini vision tile (~258 input tokens)
 * and uploads instantaneously even on mobile data.
 */
export async function compressImageForScan(file: File): Promise<CompressedImagePayload> {
  const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!validTypes.has(file.type)) {
    throw new Error('UNSUPPORTED_IMAGE_TYPE');
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('IMAGE_FILE_TOO_LARGE');
  }

  const originalKb = Math.max(1, Math.round(file.size / 1024));
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
    image.src = dataUrl;
  });

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('CANVAS_UNAVAILABLE');
  }

  // Fill white backdrop for transparent PNGs so JPEG compression stays crisp & readable
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const commaIdx = compressedDataUrl.indexOf(',');
  const imageBase64 = commaIdx !== -1 ? compressedDataUrl.slice(commaIdx + 1) : compressedDataUrl;
  const approxBytes = Math.round((imageBase64.length * 3) / 4);
  const compressedKb = Math.max(1, Math.round(approxBytes / 1024));

  return {
    previewDataUrl: compressedDataUrl,
    imageBase64,
    mimeType: 'image/jpeg',
    fileName: file.name || 'screenshot.jpg',
    originalKb,
    compressedKb,
    width: targetWidth,
    height: targetHeight,
  };
}

import type { Area } from 'react-easy-crop';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (e) => reject(e));
    if (url.startsWith('http://') || url.startsWith('https://')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = url;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality = 0.9
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality
    );
  });
}

export function blobToJpegFile(blob: Blob, name = 'property-photo.jpg'): File {
  return new File([blob], name, { type: 'image/jpeg' });
}

// Image cropping utility for selection capture

interface CropCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOptions {
  // Downscale the cropped output to this width in the same canvas pass,
  // avoiding a separate decode/re-encode cycle later in the pipeline
  maxWidth?: number;
  quality?: number;
}

export async function cropImage(
  dataUrl: string,
  coords: CropCoords,
  dpr: number = 1,
  zoom: number = 1,
  options: CropOptions = {}
): Promise<string> {
  const { maxWidth, quality = 0.85 } = options;

  // Convert data URL to bitmap
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  // Scale coordinates by device pixel ratio
  const scaledX = coords.x * dpr;
  const scaledY = coords.y * dpr;
  const scaledWidth = coords.width * dpr;
  const scaledHeight = coords.height * dpr;

  console.log('Cropping with DPR:', dpr, 'Zoom:', zoom);
  console.log('Scaled coords:', { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight });
  console.log('Source image size:', imageBitmap.width, 'x', imageBitmap.height);

  // Crop and downscale in a single draw
  let targetWidth = scaledWidth;
  let targetHeight = scaledHeight;
  if (maxWidth && scaledWidth > maxWidth) {
    targetWidth = maxWidth;
    targetHeight = Math.floor(scaledHeight * (maxWidth / scaledWidth));
  }

  console.log('Output canvas size:', targetWidth, 'x', targetHeight);

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(
    imageBitmap,
    scaledX, scaledY, scaledWidth, scaledHeight, // Source (device pixels)
    0, 0, targetWidth, targetHeight // Destination (possibly downscaled)
  );

  const resultBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(resultBlob);
  });
}

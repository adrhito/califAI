// Dynamic icon generation with user colors.
//
// The icon is drawn with canvas primitives (not SVG) so it also works in the
// MV3 service worker - chrome.action.setIcon is NOT persistent, so the
// background must re-apply the colored icon on every startup, and service
// workers cannot decode SVG or use DOM <canvas>/<img>.

type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

// Geometry matches public/icon.svg, designed on a 128x128 grid
function drawIcon(ctx: Ctx2D, size: number, primaryColor: string, secondaryColor: string): void {
  const s = size / 128;

  function roundedRect(x: number, y: number, w: number, h: number, r: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x * s, y * s, w * s, h * s, r * s);
    } else {
      ctx.rect(x * s, y * s, w * s, h * s);
    }
    ctx.fill();
  }

  // Background
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, size, size);

  // Calendar body
  roundedRect(24, 34, 80, 72, 12, secondaryColor);

  // Binding rings
  roundedRect(42, 18, 12, 28, 6, secondaryColor);
  roundedRect(74, 18, 12, 28, 6, secondaryColor);

  // Inner light area
  roundedRect(30, 50, 68, 50, 8, primaryColor);

  // Date grid - 2 rows of 3 squares
  ctx.fillStyle = secondaryColor;
  for (const x of [40, 58, 76]) {
    for (const y of [60, 80]) {
      ctx.fillRect(x * s, y * s, 12 * s, 12 * s);
    }
  }
}

export async function generateIconSet(
  primaryColor: string,
  secondaryColor: string
): Promise<{ [size: number]: ImageData }> {
  const sizes = [16, 32, 48, 128];
  const iconSet: { [size: number]: ImageData } = {};

  for (const size of sizes) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    drawIcon(ctx, size, primaryColor, secondaryColor);
    iconSet[size] = ctx.getImageData(0, 0, size, size);
  }

  return iconSet;
}

export async function applyIconColors(primaryColor: string, secondaryColor: string): Promise<void> {
  const iconSet = await generateIconSet(primaryColor, secondaryColor);
  await chrome.action.setIcon({ imageData: iconSet });
}

// Page-context only (uses DOM canvas): render the icon as a data URL
export function generateIconDataUrl(primaryColor: string, secondaryColor: string, size: number = 64): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  drawIcon(ctx, size, primaryColor, secondaryColor);
  return canvas.toDataURL('image/png');
}

// Set the page's favicon (the icon in the browser tab) to the themed icon.
// chrome.action.setIcon only changes the toolbar icon - extension pages keep
// the static manifest favicon unless overridden like this
export function applyThemedFavicon(primaryColor: string, secondaryColor: string): void {
  const href = generateIconDataUrl(primaryColor, secondaryColor, 64);
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

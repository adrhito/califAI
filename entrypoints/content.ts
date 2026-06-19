// Content script for area selection overlay
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Listen for messages
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'START_SELECTION') {
        // Use the user's custom theme colors for the overlay
        chrome.storage.local.get(['colorPrimary', 'colorSecondary']).then(stored => {
          const colors = {
            primary: stored.colorPrimary || '#FFDFB0',
            secondary: stored.colorSecondary || '#7D2E3D'
          };
          return startSelection(colors);
        }).then(coords => {
          sendResponse({ success: true, coords });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Async response
      }
    });
  }
});

interface SelectionCoords {
  x: number;
  y: number;
  width: number;
  height: number;
  dpr: number;
  zoom: number;
}

interface OverlayColors {
  primary: string;
  secondary: string;
}

async function startSelection(colors: OverlayColors): Promise<SelectionCoords> {
  return new Promise((resolve, reject) => {
    // Create overlay elements
    const overlay = document.createElement('div');
    overlay.id = 'calify-selection-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: transparent;
      cursor: crosshair;
      z-index: 2147483647;
    `;

    const selectionBox = document.createElement('div');
    selectionBox.id = 'calify-selection-box';
    selectionBox.style.cssText = `
      position: fixed;
      border: 3px solid ${colors.secondary};
      background: rgba(255, 255, 255, 0.01);
      display: none;
      pointer-events: none;
      z-index: 2147483648;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
    `;

    const instruction = document.createElement('div');
    instruction.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors.primary};
      color: ${colors.secondary};
      padding: 12px 24px;
      border: 2px solid ${colors.secondary};
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      z-index: 2147483649;
      pointer-events: none;
    `;
    instruction.textContent = 'Click and drag to select area • Press ESC to cancel';

    document.body.appendChild(overlay);
    document.body.appendChild(selectionBox);
    document.body.appendChild(instruction);

    let startX = 0;
    let startY = 0;
    let isSelecting = false;

    function cleanup() {
      overlay.remove();
      selectionBox.remove();
      instruction.remove();
    }

    function handleMouseDown(e: MouseEvent) {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0';
      selectionBox.style.height = '0';
      selectionBox.style.display = 'block';
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isSelecting) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const left = Math.min(currentX, startX);
      const top = Math.min(currentY, startY);

      selectionBox.style.left = left + 'px';
      selectionBox.style.top = top + 'px';
      selectionBox.style.width = width + 'px';
      selectionBox.style.height = height + 'px';
    }

    function handleMouseUp(e: MouseEvent) {
      if (!isSelecting) return;
      isSelecting = false;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const x = Math.min(currentX, startX);
      const y = Math.min(currentY, startY);

      console.log('[CalifAI] Selection captured:');
      console.log('  Start:', { x: startX, y: startY });
      console.log('  End:', { x: currentX, y: currentY });
      console.log('  Final coords:', { x, y, width, height });
      console.log('  Device pixel ratio:', window.devicePixelRatio);
      console.log('  Window dimensions:', { innerWidth: window.innerWidth, innerHeight: window.innerHeight });

      cleanup();

      // Minimum selection size: only reject what is almost certainly an
      // accidental click. Small selections (e.g. a single event row) are
      // valid - the cropped area is sent to the AI at native resolution
      if (width < 10 || height < 10) {
        console.error('[CalifAI] Selection too small!', { width, height, minimum: 10 });
        reject(new Error('Selection too small. Click and drag a box around the event text.'));
        return;
      }

      // Get browser zoom level (Ctrl+Plus zoom, not DPR)
      const zoom = window.devicePixelRatio / (window.outerWidth / window.innerWidth);

      const result = {
        x,
        y,
        width,
        height,
        dpr: window.devicePixelRatio || 1,
        zoom: Math.round(zoom * 100) / 100 // Round to 2 decimals
      };

      console.log('[CalifAI] Sending selection result:', result);

      resolve(result);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        cleanup();
        reject(new Error('Selection cancelled'));
      }
    }

    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
  });
}

// Shared session-storage state for the capture pipeline.
//
// The background stores capture progress here because the popup closes
// during area selection. A processingCapture flag with no live background
// work behind it (service worker killed mid-extraction, browser crash)
// would otherwise trap the popup in the loading view forever, so writes
// are timestamped and readers treat old flags as failed.

export const CAPTURE_SESSION_KEYS = [
  'processingCapture',
  'processingStartedAt',
  'captureComplete',
  'captureResult',
  'captureError'
];

// Generous upper bound: extraction with Gemini retries can take ~1 minute
export const PROCESSING_TIMEOUT_MS = 120_000;

export const PROCESSING_TIMEOUT_MESSAGE =
  'Processing took too long and was stopped. Please try capturing again.';

export async function clearCaptureSession(): Promise<void> {
  await chrome.storage.session.remove(CAPTURE_SESSION_KEYS);
}

export function isProcessingStale(startedAt?: number): boolean {
  return typeof startedAt === 'number' && Date.now() - startedAt > PROCESSING_TIMEOUT_MS;
}

export interface CaptureSessionState {
  processingCapture?: boolean;
  processingStartedAt?: number;
  captureComplete?: boolean;
  captureResult?: { events?: any[] };
  captureError?: string;
}

export type CaptureWaitResult =
  | { status: 'complete'; state: CaptureSessionState }
  | { status: 'timeout' }
  | { status: 'cancelled' };

// Wait for the background to finish a pending capture. Event-driven via
// storage.onChanged (instant, instead of the up-to-500ms polling lag), with
// a slow fallback poll in case a change event is missed.
export function waitForCaptureCompletion(
  timeoutMs: number = PROCESSING_TIMEOUT_MS
): Promise<CaptureWaitResult> {
  return new Promise((resolve) => {
    let settled = false;

    function finish(result: CaptureWaitResult) {
      if (settled) return;
      settled = true;
      chrome.storage.session.onChanged.removeListener(onChanged);
      clearInterval(fallbackPoll);
      clearTimeout(timeout);
      resolve(result);
    }

    async function check() {
      const state = (await chrome.storage.session.get(CAPTURE_SESSION_KEYS)) as CaptureSessionState;
      if (state.processingCapture) return;
      if (state.captureComplete) {
        finish({ status: 'complete', state });
      } else {
        // Processing flag gone without a result: the user cancelled
        finish({ status: 'cancelled' });
      }
    }

    function onChanged(changes: Record<string, chrome.storage.StorageChange>) {
      if ('captureComplete' in changes || 'processingCapture' in changes) {
        void check();
      }
    }

    chrome.storage.session.onChanged.addListener(onChanged);
    const fallbackPoll = setInterval(check, 2000);
    const timeout = setTimeout(() => finish({ status: 'timeout' }), timeoutMs);
    // Cover completion that happened before the listener attached
    void check();
  });
}

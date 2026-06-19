// Shared "Capture More" logic for ReviewView and EventSelectionView.
//
// Capture More reuses whatever capture mode the user originally chose on the
// home screen (area selection vs full screen). Area selection closes the
// popup while the user drags; the background stores the result and reopens
// the popup on the same view, so this hook also picks up pending capture
// state on mount and merges the new events into the existing list.

import React from 'react';
import { useAppState } from './useAppState';
import { sendToBackground } from '../lib/messaging/send';
import { CalifyEvent } from '../types/event';
import {
  CAPTURE_SESSION_KEYS,
  PROCESSING_TIMEOUT_MESSAGE,
  clearCaptureSession,
  isProcessingStale,
  waitForCaptureCompletion
} from '../lib/storage/capture-session';

export function useCaptureMore() {
  const { setEvents, setView, setError, setNotice, setLoading } = useAppState();
  const [capturingMore, setCapturingMore] = React.useState(false);

  // Capture More outcomes never go to the error view - that would strand
  // the user away from the events they already have. Always return to the
  // event list with an informational notice instead
  function mergeNewEvents(newEvents: CalifyEvent[]) {
    const existing = useAppState.getState().events;

    if (newEvents.length === 0) {
      setNotice('No new events found in that capture');
      setView('event-selection');
      return;
    }

    // Duplicate detection based on title and date. The key set grows as
    // events are accepted, so duplicates WITHIN the captured batch are
    // filtered too (the AI sometimes extracts the same event twice)
    const seenKeys = new Set(existing.map(e => `${e.title}-${e.startDate}`));
    const uniqueNewEvents: CalifyEvent[] = [];
    for (const event of newEvents) {
      const key = `${event.title}-${event.startDate}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueNewEvents.push(event);
      }
    }
    const duplicateCount = newEvents.length - uniqueNewEvents.length;

    if (uniqueNewEvents.length === 0) {
      setNotice('Everything you captured is already on the list');
      setView('event-selection');
      return;
    }

    setEvents([...existing, ...uniqueNewEvents]);

    const added = uniqueNewEvents.length;
    let message = `Added ${added} event${added === 1 ? '' : 's'}`;
    if (duplicateCount > 0) {
      message += ` with ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}`;
    }
    setNotice(message);
    setView('event-selection');
  }

  function handleCaptureResult(captureError?: string, captureResult?: { events?: CalifyEvent[] }) {
    if (captureError) {
      setError({ message: captureError, retryable: true });
      setView('error');
      return;
    }
    if (captureResult) {
      mergeNewEvents(captureResult.events || []);
    }
  }

  // Pick up the result of an area-selection Capture More after the popup
  // reopens. No effect cleanup on purpose: showing the loading view unmounts
  // the calling component, and the completion waiter must keep running
  React.useEffect(() => {
    async function checkPendingCapture() {
      const result = await chrome.storage.session.get(CAPTURE_SESSION_KEYS);

      if (result.processingCapture) {
        // A flag left behind by a killed service worker would trap the
        // popup in the loading view forever - treat old flags as failed
        if (isProcessingStale(result.processingStartedAt)) {
          await clearCaptureSession();
          setError({ message: PROCESSING_TIMEOUT_MESSAGE, retryable: false });
          setView('error');
          return;
        }

        setLoading({ message: 'Processing selected area...' });
        setView('loading');

        const waitResult = await waitForCaptureCompletion();

        if (waitResult.status === 'cancelled') {
          // User pressed cancel on the loading view - nothing to do
          return;
        }

        await clearCaptureSession();
        setLoading(null);

        if (waitResult.status === 'timeout') {
          setError({ message: PROCESSING_TIMEOUT_MESSAGE, retryable: false });
          setView('error');
          return;
        }

        handleCaptureResult(waitResult.state.captureError, waitResult.state.captureResult);
        return;
      }

      if (result.captureComplete) {
        await clearCaptureSession();
        handleCaptureResult(result.captureError, result.captureResult);
      }
    }

    checkPendingCapture();
  }, []);

  async function captureMore() {
    const { lastCaptureMode } = await chrome.storage.session.get('lastCaptureMode');

    if (lastCaptureMode === 'area') {
      // Same flow as the initial area capture: the background takes over,
      // stores the result, and reopens the popup when the selection is done
      await clearCaptureSession();
      sendToBackground({
        type: 'CAPTURE_AND_EXTRACT',
        useSelection: true
      }).catch((error) => {
        console.error('Selection capture failed:', error);
      });
      window.close();
      return;
    }

    setCapturingMore(true);
    setLoading({ message: 'Capturing more events...' });

    try {
      const response = await sendToBackground({
        type: 'CAPTURE_AND_EXTRACT',
        useSelection: false
      });

      if (!response.success) {
        throw new Error(response.error.error);
      }

      mergeNewEvents(response.data.events);
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : 'Failed to capture more events',
        retryable: true
      });
      setView('error');
    } finally {
      setCapturingMore(false);
      setLoading(null);
    }
  }

  return { captureMore, capturingMore };
}

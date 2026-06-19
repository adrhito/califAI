import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CloseButton from '../ui/CloseButton';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import { saveAppState } from '../../lib/storage/session';
import { clearCaptureSession } from '../../lib/storage/capture-session';
import './ErrorView.css';

export default function ErrorView() {
  const { error, events, currentEvent, selectedEventIndices, setView, setEvents, setError, setLoading, goHome } = useAppState();
  const [connecting, setConnecting] = React.useState(false);

  if (!error) {
    return null;
  }

  async function handleRetry() {
    if (!error?.retryable) {
      return;
    }

    setLoading({ message: 'Retrying...' });
    setView('loading');

    try {
      const response = await sendToBackground({ type: 'CAPTURE_AND_EXTRACT' });

      if (!response.success) {
        throw new Error(response.error.error);
      }

      const { events } = response.data;

      if (events.length === 0) {
        setError({
          message: 'No calendar events found in the current page',
          retryable: true
        });
        setView('error');
        return;
      }

      setEvents(events);

      if (events.length === 1) {
        useAppState.getState().setCurrentEvent(events[0]);
        setView('review');
      } else {
        setView('event-selection');
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to capture and extract events',
        retryable: true
      });
      setView('error');
    } finally {
      setLoading(null);
    }
  }

  function handleGoHome() {
    goHome();
  }

  async function handleCaptureAgain() {
    if (isSelectionError) {
      // Relaunch the area selection directly instead of bouncing through
      // the home view. Land the popup on home first (and persist it before
      // closing) so the pending capture is picked up when the popup reopens
      await clearCaptureSession();
      setError(null);
      goHome();
      await saveAppState(useAppState.getState());

      sendToBackground({
        type: 'CAPTURE_AND_EXTRACT',
        useSelection: true
      }).catch((err) => {
        console.error('Selection capture failed:', err);
      });

      window.close();
      return;
    }

    goHome();
  }

  function handleChangeKeys() {
    chrome.runtime.openOptionsPage();
  }

  async function handleConnectGoogle() {
    setConnecting(true);

    try {
      // AUTHORIZE_GOOGLE shows Google's account chooser without revoking the
      // current grant, so approved accounts skip the consent screen
      const response = await sendToBackground({ type: 'AUTHORIZE_GOOGLE' });

      if (!response.success || !response.data.success) {
        throw new Error('Google authorization failed. Please try again.');
      }

      // Reconnected - return the user to where they left off
      setError(null);
      if (currentEvent || selectedEventIndices.length > 0) {
        setView('review');
      } else if (events.length > 0) {
        setView('event-selection');
      } else {
        goHome();
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Google authorization failed',
        code: 'AUTH_REQUIRED',
        retryable: false
      });
    } finally {
      setConnecting(false);
    }
  }

  // Check if this is a rate limit error
  const isRateLimitError = error?.message?.toLowerCase().includes('rate limit') ||
                           error?.message?.toLowerCase().includes('request limit') ||
                           error?.message?.toLowerCase().includes('quota');

  // Check if this is a Google auth error - the user needs to (re)connect
  const lowerMessage = error?.message?.toLowerCase() || '';
  const isAuthError = error?.code === 'AUTH_REQUIRED' ||
                      lowerMessage.includes('invalid authentication credentials') ||
                      lowerMessage.includes('login required') ||
                      lowerMessage.includes('authorization failed') ||
                      lowerMessage.includes('reconnect your google account') ||
                      lowerMessage.includes('account not connected');

  // API key problems get a shortcut to the settings page
  const isApiKeyError = lowerMessage.includes('api key');

  // Selection errors (too small, cancelled) can't be fixed by "Try Again"
  // (which re-runs a full-screen capture) - the user needs to reselect the
  // area, so only offer "Capture Again"
  const isSelectionError = lowerMessage.includes('selection too small') ||
                           lowerMessage.includes('selection cancelled');

  return (
    <div className="error-view">
      <CloseButton onClick={handleGoHome} title="Go to Home" />
      <div className="error-content">
        <div className="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="var(--error)" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="error-title">Something went wrong</h2>
        <p className="error-message text-muted">
          {error.message}
        </p>

        {error.code && (
          <p className="error-code text-xs text-muted">
            Error code: {error.code}
          </p>
        )}

        <Card className="error-card">
          <div className="error-actions">
            {isAuthError && (
              <Button variant="primary" onClick={handleConnectGoogle} loading={connecting} fullWidth>
                Connect Google Account
              </Button>
            )}
            {error.retryable && !isAuthError && !isSelectionError && (
              <Button variant="primary" onClick={handleRetry} fullWidth>
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={handleCaptureAgain} fullWidth>
              Capture Again
            </Button>
            {(isRateLimitError || isApiKeyError) && (
              <Button variant="outline" onClick={handleChangeKeys} fullWidth>
                Change API Keys
              </Button>
            )}
          </div>
        </Card>

        <div className="error-help">
          <p className="text-xs text-muted">
            Make sure:
          </p>
          <ul className="error-help-list text-xs text-muted">
            <li>The page has visible calendar event information</li>
            <li>Your API key is configured in settings</li>
            <li>You have a stable internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

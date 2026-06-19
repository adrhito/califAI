import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import {
  CAPTURE_SESSION_KEYS,
  PROCESSING_TIMEOUT_MESSAGE,
  clearCaptureSession,
  isProcessingStale,
  waitForCaptureCompletion
} from '../../lib/storage/capture-session';
import './HomeView.css';

export default function HomeView() {
  const { setView, setEvents, setError, setLoading } = useAppState();
  const [capturing, setCapturing] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<{ email: string; name: string } | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = React.useState(true);
  const [currentModel, setCurrentModel] = React.useState<string>('Gemini');

  React.useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await sendToBackground({ type: 'GET_USER_INFO' });
        if (response.success && response.data) {
          setUserInfo(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      } finally {
        setLoadingUserInfo(false);
      }
    }
    fetchUserInfo();
  }, []);

  React.useEffect(() => {
    async function loadModel() {
      const { getSettings } = await import('../../lib/storage/settings');
      const settings = await getSettings();
      const modelName = settings.provider === 'openai' ? 'GPT' : 'Gemini';
      setCurrentModel(modelName);
    }
    loadModel();
  }, []);

  // Check for processing or completed capture on mount
  React.useEffect(() => {
    async function checkCaptureState() {
      const result = await chrome.storage.session.get(CAPTURE_SESSION_KEYS);

      // If still processing, show loading
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

        const { captureError, captureResult } = waitResult.state;

        // Check for errors first
        if (captureError) {
          setError({
            message: captureError,
            retryable: true
          });
          setView('error');
          return;
        }

        // Check for results
        if (captureResult) {
          const { events, usedFallback } = captureResult as any;

          if (usedFallback) {
            console.log('Used OpenAI fallback due to Gemini rate limit');
          }

          if (events.length === 0) {
            setError({
              message: 'No calendar events found in the captured area',
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
        }

        return;
      }

      // If already completed, show results immediately
      if (result.captureComplete) {
        // Clear the stored data
        await clearCaptureSession();

        // Check for errors first
        if (result.captureError) {
          setError({
            message: result.captureError,
            retryable: true
          });
          setView('error');
          return;
        }

        // Check for results
        if (result.captureResult) {
          const { events, usedFallback } = result.captureResult;

          if (usedFallback) {
            console.log('Used OpenAI fallback due to Gemini rate limit');
          }

          if (events.length === 0) {
            setError({
              message: 'No calendar events found in the captured area',
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
        }
      }
    }
    checkCaptureState();
  }, []);

  async function handleCapture(useSelection: boolean) {
    // Clear any previous capture state before starting new capture
    await clearCaptureSession();

    // Remember the mode so "Capture More" can reuse it
    await chrome.storage.session.set({ lastCaptureMode: useSelection ? 'area' : 'screen' });

    if (useSelection) {
      // For selection mode: trigger selection in background, then close popup
      // Background will handle everything and store result
      sendToBackground({
        type: 'CAPTURE_AND_EXTRACT',
        useSelection: true
      }).catch((error) => {
        console.error('Selection capture failed:', error);
      });

      // Close popup immediately to show selection overlay
      window.close();
      return;
    }

    // For full screen capture: normal flow
    setCapturing(true);
    setLoading({ message: 'Capturing screen...' });
    setView('loading');

    try {
      const response = await sendToBackground({
        type: 'CAPTURE_AND_EXTRACT',
        useSelection: false
      });

      if (!response.success) {
        throw new Error(response.error.error);
      }

      const { events, usedFallback } = response.data;

      if (usedFallback) {
        console.log('Used OpenAI fallback due to Gemini rate limit');
      }

      if (events.length === 0) {
        setError({
          message: 'No calendar events found in the captured area',
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
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : 'Failed to capture and extract events',
        retryable: true
      });
      setView('error');
    } finally {
      setCapturing(false);
      setLoading(null);
    }
  }

  function handleOpenSettings() {
    chrome.runtime.openOptionsPage();
  }

  async function handleSwitchAccount() {
    try {
      setLoadingUserInfo(true);
      // AUTHORIZE_GOOGLE always shows Google's account chooser. The current
      // grant is intentionally NOT revoked first - revoking would force a
      // full re-consent, which shows the "unverified app" warning page.
      // If the user closes the chooser without picking an account, the
      // current account stays connected and displayed unchanged
      const authResponse = await sendToBackground({ type: 'AUTHORIZE_GOOGLE' });
      if (authResponse.success && authResponse.data.success) {
        // Fetch new user info
        const response = await sendToBackground({ type: 'GET_USER_INFO' });
        if (response.success && response.data) {
          setUserInfo(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
      setError({
        message: 'Failed to switch Google account',
        retryable: true
      });
    } finally {
      setLoadingUserInfo(false);
    }
  }

  return (
    <div className="home-view">
      <div className="home-header">
        <button className="settings-button" onClick={handleOpenSettings} title="Settings">
          [SETTINGS]
        </button>
        <button className="model-indicator" onClick={handleOpenSettings} title="Switch model">
          [{currentModel}]
        </button>
        <h1 className="home-title">CalifAI</h1>
        <p className="home-subtitle">
          Capture calendar events from any webpage and add them to Google Calendar
        </p>
      </div>

      <Card padding="none">
        <div style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.6, marginBottom: 'var(--space-2)' }}>
              Google Account
            </div>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}>
              {loadingUserInfo ? 'Loading...' : userInfo ? userInfo.email : 'Not connected'}
            </div>
          </div>
          {userInfo ? (
            <Button variant="outline" size="sm" onClick={handleSwitchAccount}>
              Switch
            </Button>
          ) : !loadingUserInfo && (
            <Button size="sm" onClick={handleSwitchAccount}>
              Connect
            </Button>
          )}
        </div>
      </Card>

      <Card className="home-instructions">
        <h3 className="text-base font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
          How it works
        </h3>
        <ol className="home-steps">
          <li>Capture full screen or select specific area</li>
          <li>AI will extract event details from the captured area</li>
          <li>Review and edit the event information</li>
          <li>Add to calendar and share link</li>
        </ol>
      </Card>

      <div className="home-actions">
        <Button
          size="lg"
          loading={capturing}
          onClick={() => handleCapture(false)}
        >
          Capture Screen
        </Button>
        <Button
          size="lg"
          loading={capturing}
          onClick={() => handleCapture(true)}
        >
          Capture Area
        </Button>
      </div>

      <div className="home-footer">
        <p className="text-xs text-muted">
          Make sure the page with event information is visible before capturing
        </p>
      </div>
    </div>
  );
}

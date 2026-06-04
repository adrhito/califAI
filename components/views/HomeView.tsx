import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import './HomeView.css';

export default function HomeView() {
  const { setView, setEvents, setError, setLoading } = useAppState();
  const [capturing, setCapturing] = React.useState(false);

  async function handleCapture() {
    setCapturing(true);
    setLoading({ message: 'Capturing screen...' });
    setView('loading');

    try {
      // Capture and extract
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

      // Route based on number of events
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

  return (
    <div className="home-view">
      <div className="home-header">
        <button className="settings-button" onClick={handleOpenSettings} title="Settings">
          ⚙️
        </button>
        <h1 className="home-title">CalifAI</h1>
        <p className="home-subtitle">
          Capture calendar events from any webpage and add them to Google Calendar
        </p>
      </div>

      <Card className="home-instructions">
        <h3 className="text-base font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
          How it works
        </h3>
        <ol className="home-steps">
          <li>Click the capture button below</li>
          <li>AI will extract event details from the page</li>
          <li>Review and edit the event information</li>
          <li>Add to your Google Calendar</li>
        </ol>
      </Card>

      <div className="home-actions">
        <Button
          size="lg"
          fullWidth
          loading={capturing}
          onClick={handleCapture}
        >
          Capture Event
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

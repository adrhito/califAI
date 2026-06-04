import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import './ErrorView.css';

export default function ErrorView() {
  const { error, setView, setEvents, setError, setLoading, reset } = useAppState();

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
    reset();
  }

  return (
    <div className="error-view">
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
            {error.retryable && (
              <Button variant="primary" onClick={handleRetry} fullWidth>
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={handleGoHome} fullWidth>
              Go to Home
            </Button>
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

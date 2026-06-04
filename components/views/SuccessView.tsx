import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import './SuccessView.css';

export default function SuccessView() {
  const { createdEventUrl, reset } = useAppState();

  function handleViewEvent() {
    if (createdEventUrl) {
      chrome.tabs.create({ url: createdEventUrl });
    }
  }

  function handleAddAnother() {
    reset();
  }

  return (
    <div className="success-view">
      <div className="success-content">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="var(--success)" strokeWidth="2" />
            <path d="M8 12L11 15L16 9" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="success-title">Event Added!</h2>
        <p className="success-message text-muted">
          Your event has been successfully added to Google Calendar
        </p>

        <Card className="success-card">
          <div className="success-actions">
            {createdEventUrl && (
              <Button variant="outline" onClick={handleViewEvent} fullWidth>
                View in Calendar
              </Button>
            )}
            <Button onClick={handleAddAnother} fullWidth>
              Add Another Event
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

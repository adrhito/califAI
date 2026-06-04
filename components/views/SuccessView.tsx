import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import './SuccessView.css';

export default function SuccessView() {
  const { createdEventUrl, createdEventUrls, reset } = useAppState();

  const isMultiple = createdEventUrls.length > 0;
  const eventCount = isMultiple ? createdEventUrls.length : 1;

  function handleViewEvent(url?: string) {
    const urlToOpen = url || createdEventUrl;
    if (urlToOpen) {
      chrome.tabs.create({ url: urlToOpen });
    }
  }

  function handleViewCalendar() {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
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

        <h2 className="success-title">
          {isMultiple ? `${eventCount} Events Added!` : 'Event Added!'}
        </h2>
        <p className="success-message text-muted">
          {isMultiple
            ? `Your ${eventCount} events have been successfully added to Google Calendar`
            : 'Your event has been successfully added to Google Calendar'}
        </p>

        <Card className="success-card">
          <div className="success-actions">
            {isMultiple ? (
              <Button variant="outline" onClick={handleViewCalendar} fullWidth>
                View Calendar
              </Button>
            ) : createdEventUrl ? (
              <Button variant="outline" onClick={() => handleViewEvent()} fullWidth>
                View in Calendar
              </Button>
            ) : null}
            <Button onClick={handleAddAnother} fullWidth>
              Add More Events
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

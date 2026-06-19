import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CloseButton from '../ui/CloseButton';
import CoffeeIcon from '../ui/CoffeeIcon';
import { useAppState } from '../../hooks/useAppState';
import { generateGoogleCalendarLink, generateCalendarViewLink } from '../../lib/utils/calendar-link';
import { downloadIcsFile } from '../../lib/utils/ics';
import { SUPPORT_URL } from '../../lib/constants';
import './SuccessView.css';

export default function SuccessView() {
  const { createdEventUrl, createdEventUrls, events, selectedEventIndices, currentEvent, goHome } = useAppState();
  const [notification, setNotification] = React.useState<string | null>(null);

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
    goHome();
  }

  function getEventsToShare() {
    return createdEventUrls.length > 0
      ? selectedEventIndices.map(i => events[i])
      : currentEvent ? [currentEvent] : [];
  }

  function handleDownloadIcs() {
    const eventsToShare = getEventsToShare();

    if (eventsToShare.length === 0) {
      setNotification('No events to export');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    downloadIcsFile(eventsToShare);
    setNotification('Downloaded! The .ics file imports into any calendar app.');
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleShareLink() {
    const eventsToShare = getEventsToShare();

    if (eventsToShare.length === 0) {
      setNotification('No events to share');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Always copy a SINGLE link. Google Calendar has no URL that adds
    // multiple events at once, so for multiple events we link to the
    // calendar view covering their date range instead
    const shareText = eventsToShare.length > 1
      ? generateCalendarViewLink(eventsToShare)
      : generateGoogleCalendarLink(eventsToShare[0]);

    await navigator.clipboard.writeText(shareText);

    if (eventsToShare.length > 1) {
      setNotification('Calendar link copied! It opens the calendar where your events are.');
    } else {
      setNotification('Shareable link copied to clipboard!');
    }

    setTimeout(() => setNotification(null), 3000);
  }

  return (
    <div className="success-view">
      <CloseButton onClick={goHome} title="Go to Home" />
      {notification && (
        <div className="success-notification">
          {notification}
        </div>
      )}
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
            <div className="success-actions-row">
              <Button variant="outline" onClick={handleShareLink}>
                Share Link
              </Button>
              <Button variant="outline" onClick={handleDownloadIcs}>
                Download .ics
              </Button>
            </div>
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

        <div className="coffee-support">
          <button
            onClick={() => chrome.tabs.create({ url: SUPPORT_URL })}
            className="coffee-button"
            title="Support CalifAI development"
            aria-label="Buy me a coffee"
          >
            <CoffeeIcon />
          </button>
          <span className="coffee-label">Buy me a coffee</span>
        </div>
      </div>
    </div>
  );
}

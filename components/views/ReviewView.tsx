import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import { format } from 'date-fns';
import './ReviewView.css';

export default function ReviewView() {
  const {
    currentEvent,
    events,
    selectedEventIndices,
    setView,
    setError,
    setLoading,
    setCreatedEventUrl,
    setCreatedEventUrls
  } = useAppState();
  const [importing, setImporting] = React.useState(false);

  const isMultipleEvents = selectedEventIndices.length > 1;
  const selectedEvents = isMultipleEvents
    ? selectedEventIndices.map(i => events[i])
    : currentEvent ? [currentEvent] : [];

  if (selectedEvents.length === 0) {
    return null;
  }

  function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.8) return <Badge variant="success">High</Badge>;
    if (confidence >= 0.6) return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="error">Low</Badge>;
  }

  async function handleImport() {
    setImporting(true);
    setLoading({
      message: isMultipleEvents
        ? `Adding ${selectedEvents.length} events to Google Calendar...`
        : 'Adding to Google Calendar...'
    });
    setView('importing');

    try {
      // Check if authorized
      const authResponse = await sendToBackground({ type: 'CHECK_GOOGLE_AUTH' });
      if (!authResponse.success || !authResponse.data.authorized) {
        // Need to authorize
        const authResult = await sendToBackground({ type: 'AUTHORIZE_GOOGLE' });
        if (!authResult.success || !authResult.data.success) {
          throw new Error('Google authorization failed');
        }
      }

      if (isMultipleEvents) {
        // Create multiple events
        const response = await sendToBackground({
          type: 'CREATE_EVENTS',
          events: selectedEvents,
          calendarId: 'primary'
        });

        if (!response.success) {
          throw new Error(response.error.error);
        }

        setCreatedEventUrls(response.data.results.map(r => r.eventUrl));
        setView('success');
      } else {
        // Create single event
        const response = await sendToBackground({
          type: 'CREATE_EVENT',
          event: selectedEvents[0],
          calendarId: 'primary'
        });

        if (!response.success) {
          throw new Error(response.error.error);
        }

        setCreatedEventUrl(response.data.eventUrl);
        setView('success');
      }
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : 'Failed to create event(s)',
        retryable: true
      });
      setView('error');
    } finally {
      setImporting(false);
      setLoading(null);
    }
  }

  function handleEdit() {
    setView('edit');
  }

  function renderEventCard(event: typeof selectedEvents[0], showTitle: boolean = false) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    return (
      <Card className="review-event" key={event.title}>
        {showTitle && (
          <h3 className="review-event-title" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            {event.title}
          </h3>
        )}

        {!showTitle && (
          <div className="review-field">
            <div className="review-field-header">
              <span className="review-field-label">Title</span>
              {event.confidence && getConfidenceBadge(event.confidence.title)}
            </div>
            <div className="review-field-value">{event.title}</div>
          </div>
        )}

        {event.description && (
          <div className="review-field">
            <span className="review-field-label">Description</span>
            <div className="review-field-value">{event.description}</div>
          </div>
        )}

        <div className="review-field">
          <div className="review-field-header">
            <span className="review-field-label">Date & Time</span>
            {event.confidence && getConfidenceBadge(event.confidence.date)}
          </div>
          <div className="review-field-value">
            {event.isAllDay ? (
              <>
                {format(startDate, 'MMMM d, yyyy')}
                {startDate.getTime() !== endDate.getTime() && ` - ${format(endDate, 'MMMM d, yyyy')}`}
              </>
            ) : (
              <>
                {format(startDate, 'MMMM d, yyyy')} at {format(startDate, 'h:mm a')}
                {' → '}
                {format(endDate, 'h:mm a')}
              </>
            )}
          </div>
          <div className="review-field-meta text-muted text-xs">
            {event.timezone}
          </div>
        </div>

        {event.location && (
          <div className="review-field">
            <div className="review-field-header">
              <span className="review-field-label">Location</span>
              {event.confidence && getConfidenceBadge(event.confidence.location)}
            </div>
            <div className="review-field-value">{event.location}</div>
          </div>
        )}

        {event.recurrence && (
          <div className="review-field">
            <span className="review-field-label">Recurrence</span>
            <div className="review-field-value">
              {event.recurrence.frequency}
              {event.recurrence.interval && ` every ${event.recurrence.interval}`}
            </div>
          </div>
        )}

        {event.reminders && event.reminders.length > 0 && (
          <div className="review-field">
            <span className="review-field-label">Reminders</span>
            <div className="review-field-value">
              {event.reminders.map((reminder, i) => (
                <div key={i}>
                  {reminder.method} - {reminder.minutes} minutes before
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="review-view">
      <div className="review-header">
        <h2 className="review-title">
          {isMultipleEvents ? `Review ${selectedEvents.length} Events` : 'Review Event'}
        </h2>
        <p className="review-subtitle text-muted">
          Verify the event details before adding to calendar
        </p>
      </div>

      {isMultipleEvents ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedEvents.map(event => renderEventCard(event, true))}
        </div>
      ) : (
        renderEventCard(selectedEvents[0], false)
      )}


      <div className="review-actions">
        {!isMultipleEvents && (
          <Button variant="outline" onClick={handleEdit} fullWidth>
            Edit Details
          </Button>
        )}
        <Button onClick={handleImport} loading={importing} fullWidth>
          {isMultipleEvents ? `Add ${selectedEvents.length} Events to Calendar` : 'Add to Calendar'}
        </Button>
      </div>
    </div>
  );
}

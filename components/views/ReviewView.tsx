import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import { format } from 'date-fns';
import './ReviewView.css';

export default function ReviewView() {
  const { currentEvent, setView, setError, setLoading, setCreatedEventUrl } = useAppState();
  const [importing, setImporting] = React.useState(false);

  if (!currentEvent) {
    return null;
  }

  function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.8) return <Badge variant="success">High</Badge>;
    if (confidence >= 0.6) return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="error">Low</Badge>;
  }

  async function handleImport() {
    setImporting(true);
    setLoading({ message: 'Adding to Google Calendar...' });
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

      // Create event
      const response = await sendToBackground({
        type: 'CREATE_EVENT',
        event: currentEvent!,
        calendarId: 'primary'
      });

      if (!response.success) {
        throw new Error(response.error.error);
      }

      setCreatedEventUrl(response.data.eventUrl);
      setView('success');
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : 'Failed to create event',
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

  const startDate = new Date(currentEvent.startDate);
  const endDate = new Date(currentEvent.endDate);

  return (
    <div className="review-view">
      <div className="review-header">
        <h2 className="review-title">Review Event</h2>
        <p className="review-subtitle text-muted">
          Verify the event details before adding to calendar
        </p>
      </div>

      <Card className="review-event">
        <div className="review-field">
          <div className="review-field-header">
            <span className="review-field-label">Title</span>
            {currentEvent.confidence && getConfidenceBadge(currentEvent.confidence.title)}
          </div>
          <div className="review-field-value">{currentEvent.title}</div>
        </div>

        {currentEvent.description && (
          <div className="review-field">
            <span className="review-field-label">Description</span>
            <div className="review-field-value">{currentEvent.description}</div>
          </div>
        )}

        <div className="review-field">
          <div className="review-field-header">
            <span className="review-field-label">Date & Time</span>
            {currentEvent.confidence && getConfidenceBadge(currentEvent.confidence.date)}
          </div>
          <div className="review-field-value">
            {currentEvent.isAllDay ? (
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
            {currentEvent.timezone}
          </div>
        </div>

        {currentEvent.location && (
          <div className="review-field">
            <div className="review-field-header">
              <span className="review-field-label">Location</span>
              {currentEvent.confidence && getConfidenceBadge(currentEvent.confidence.location)}
            </div>
            <div className="review-field-value">{currentEvent.location}</div>
          </div>
        )}

        {currentEvent.recurrence && (
          <div className="review-field">
            <span className="review-field-label">Recurrence</span>
            <div className="review-field-value">
              {currentEvent.recurrence.frequency}
              {currentEvent.recurrence.interval && ` every ${currentEvent.recurrence.interval}`}
            </div>
          </div>
        )}

        {currentEvent.reminders && currentEvent.reminders.length > 0 && (
          <div className="review-field">
            <span className="review-field-label">Reminders</span>
            <div className="review-field-value">
              {currentEvent.reminders.map((reminder, i) => (
                <div key={i}>
                  {reminder.method} - {reminder.minutes} minutes before
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="review-actions">
        <Button variant="outline" onClick={handleEdit} fullWidth>
          Edit Details
        </Button>
        <Button onClick={handleImport} loading={importing} fullWidth>
          Add to Calendar
        </Button>
      </div>
    </div>
  );
}

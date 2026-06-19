import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ColorPicker from '../ui/ColorPicker';
import CloseButton from '../ui/CloseButton';
import EditIcon from '../ui/EditIcon';
import { useAppState } from '../../hooks/useAppState';
import { useCaptureMore } from '../../hooks/useCaptureMore';
import { sendToBackground } from '../../lib/messaging/send';
import { format } from 'date-fns';
import { formatDateForDisplay, formatTimeForDisplay } from '../../lib/utils/date';
import { getSettings } from '../../lib/storage/settings';
import type { CalifyEvent } from '../../types/event';
import './ReviewView.css';

export default function ReviewView() {
  const {
    currentEvent,
    events,
    selectedEventIndices,
    setView,
    setCurrentEvent,
    setEditingEventIndex,
    setError,
    setLoading,
    setCreatedEventUrl,
    setCreatedEventUrls,
    goBack,
    goHome
  } = useAppState();
  const [importing, setImporting] = React.useState(false);
  const { captureMore, capturingMore } = useCaptureMore();
  const [timeFormat, setTimeFormat] = React.useState<'12h' | '24h'>('12h');
  const [dateFormat, setDateFormat] = React.useState<'US' | 'ISO'>('US');
  const [defaultEventColor, setDefaultEventColor] = React.useState<string>('');

  // Track color selections for each event
  const [eventColors, setEventColors] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    async function loadFormats() {
      const settings = await getSettings();
      setTimeFormat(settings.timeFormat || '12h');
      setDateFormat(settings.dateFormat || 'US');
      setDefaultEventColor(settings.defaultEventColor || '');

      // Initialize event colors with default if available
      if (settings.defaultEventColor && selectedEvents.length > 0) {
        const initialColors: Record<number, string> = {};
        selectedEvents.forEach((_, idx) => {
          initialColors[idx] = settings.defaultEventColor!;
        });
        setEventColors(initialColors);
      }
    }
    loadFormats();
  }, []);

  const isMultipleEvents = selectedEventIndices.length > 1;
  const selectedEvents = isMultipleEvents
    ? selectedEventIndices.map(i => events[i])
    : currentEvent ? [currentEvent] : [];

  if (selectedEvents.length === 0) {
    return null;
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

      // Add selected colors to events (use eventColors, then defaultEventColor, then event.colorId)
      const eventsWithColors = selectedEvents.map((event, idx) => ({
        ...event,
        colorId: eventColors[idx] || defaultEventColor || event.colorId
      }));

      if (isMultipleEvents) {
        // Create multiple events
        const response = await sendToBackground({
          type: 'CREATE_EVENTS',
          events: eventsWithColors,
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
          event: eventsWithColors[0],
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

  function handleEdit(eventIndex: number) {
    // Set the event to edit based on whether it's multi-select or single
    if (isMultipleEvents) {
      const actualEventIndex = selectedEventIndices[eventIndex];
      setEditingEventIndex(actualEventIndex);
      setCurrentEvent(events[actualEventIndex]);
    } else {
      setEditingEventIndex(null);
    }
    setView('edit');
  }

  function handleBack() {
    goBack();
  }

  function formatRecurrence(event: CalifyEvent): string {
    if (!event.recurrence) return '';

    const { frequency, interval = 1, byDay, count, until } = event.recurrence;

    const frequencyText = frequency === 'DAILY' ? 'day' :
                         frequency === 'WEEKLY' ? 'week' :
                         frequency === 'MONTHLY' ? 'month' : 'year';

    let text = interval === 1 ? `Every ${frequencyText}` : `Every ${interval} ${frequencyText}s`;

    if (byDay && byDay.length > 0) {
      const dayMap: Record<string, string> = {
        'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday',
        'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday'
      };
      const dayNames = byDay.map(d => dayMap[d] || d).join(', ');
      text += ` on ${dayNames}`;
    }

    if (count) {
      text += ` (${count} occurrence${count === 1 ? '' : 's'})`;
    } else if (until) {
      text += ` until ${format(new Date(until), 'MMMM d, yyyy')}`;
    }

    return text;
  }

  function renderEventCard(event: typeof selectedEvents[0], showTitle: boolean = false, eventIndex: number = 0) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    return (
      <Card className="review-event" key={event.title} style={{ position: 'relative' }}>
        <button
          className="review-event-edit-button"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(eventIndex);
          }}
          title="Edit event"
        >
          <EditIcon size={18} />
        </button>
        {showTitle && (
          <h3 className="review-event-title" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {event.title}
            {event.recurrence && (
              <span className="recurring-badge-review">RECURRING</span>
            )}
          </h3>
        )}

        {!showTitle && (
          <div className="review-field">
            <span className="review-field-label">Title</span>
            <div className="review-field-value">{event.title}</div>
          </div>
        )}

        {/* Color picker */}
        <div className="review-field">
          <ColorPicker
            label="Event Color"
            value={eventColors[eventIndex]}
            onChange={(colorId) => setEventColors(prev => ({ ...prev, [eventIndex]: colorId }))}
          />
        </div>

        {event.description && (
          <div className="review-field">
            <span className="review-field-label">Description</span>
            <div className="review-field-value">{event.description}</div>
          </div>
        )}

        <div className="review-field">
          <span className="review-field-label">Date & Time</span>
          <div className="review-field-value">
            {event.isAllDay ? (
              <>
                {formatDateForDisplay(event.startDate, dateFormat)}
                {startDate.getTime() !== endDate.getTime() && ` - ${formatDateForDisplay(event.endDate, dateFormat)}`}
              </>
            ) : (
              <>
                {formatDateForDisplay(event.startDate, dateFormat)} at {formatTimeForDisplay(event.startDate, timeFormat)}
                {' → '}
                {formatTimeForDisplay(event.endDate, timeFormat)}
              </>
            )}
          </div>
        </div>

        {event.location && (
          <div className="review-field">
            <span className="review-field-label">Location</span>
            <div className="review-field-value">{event.location}</div>
          </div>
        )}

        {event.recurrence && (
          <div className="review-field review-field-recurring">
            <span className="review-field-label">Recurrence</span>
            <div className="review-field-value">
              {formatRecurrence(event)}
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
      <CloseButton onClick={goHome} title="Go to Home" />
      <div className="review-header">
        <h2 className="review-title">
          {isMultipleEvents ? `Review ${selectedEvents.length} Events` : 'Review Event'}
        </h2>
        <p className="review-subtitle">
          Verify the event details before adding to calendar
        </p>
        <p className="review-capture-hint">
          Missing events? Scroll the page to show more, then click "Capture More"
        </p>
      </div>

      <div className="review-content">
        {isMultipleEvents ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {selectedEvents.map((event, idx) => renderEventCard(event, true, idx))}
          </div>
        ) : (
          renderEventCard(selectedEvents[0], false, 0)
        )}
      </div>

      <div className="review-actions">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button variant="outline" onClick={captureMore} loading={capturingMore}>
          Capture More
        </Button>
        <Button onClick={handleImport} loading={importing} fullWidth>
          Add ({selectedEvents.length})
        </Button>
      </div>
    </div>
  );
}

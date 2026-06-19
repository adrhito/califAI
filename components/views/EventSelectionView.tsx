import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CloseButton from '../ui/CloseButton';
import { useAppState } from '../../hooks/useAppState';
import { useCaptureMore } from '../../hooks/useCaptureMore';
import { CalifyEvent } from '../../types/event';
import { format } from 'date-fns';
import './EventSelectionView.css';

export default function EventSelectionView() {
  const { events, notice, setNotice, setCurrentEvent, setSelectedEventIndices, setView, goBack, goHome } = useAppState();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const { captureMore, capturingMore } = useCaptureMore();

  // Clear selected indices from global state when component mounts
  useEffect(() => {
    setSelectedEventIndices([]);
  }, []);

  // Auto-dismiss the capture notice banner
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleToggleEvent(index: number) {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  }

  function handleSelectAll() {
    if (selectedIndices.size === events.length) {
      // All selected, deselect all
      setSelectedIndices(new Set());
    } else {
      // Select all
      setSelectedIndices(new Set(events.map((_, index) => index)));
    }
  }

  function handleContinue() {
    if (selectedIndices.size === 1) {
      // Single event - go to review view
      const index = Array.from(selectedIndices)[0];
      setCurrentEvent(events[index]);
      setView('review');
    } else if (selectedIndices.size > 1) {
      // Multiple events - save indices and go to review
      setSelectedEventIndices(Array.from(selectedIndices));
      // Set the first event as current for potential editing
      setCurrentEvent(events[Array.from(selectedIndices)[0]]);
      setView('review');
    }
  }

  function handleCancel() {
    goBack();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function formatEventDate(event: CalifyEvent) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (event.isAllDay) {
      return format(startDate, 'MMMM d, yyyy');
    }

    return `${format(startDate, 'MMM d, yyyy')} at ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  }

  function formatRecurrence(event: CalifyEvent): string | null {
    if (!event.recurrence) return null;

    const { frequency, interval = 1, byDay, count, until } = event.recurrence;

    const frequencyText = frequency === 'DAILY' ? 'day' :
                         frequency === 'WEEKLY' ? 'week' :
                         frequency === 'MONTHLY' ? 'month' : 'year';

    let text = interval === 1 ? `Every ${frequencyText}` : `Every ${interval} ${frequencyText}s`;

    if (byDay && byDay.length > 0) {
      const dayNames = byDay.map(d => d.substring(0, 2)).join(', ');
      text += ` on ${dayNames}`;
    }

    if (count) {
      text += ` (${count} times)`;
    } else if (until) {
      text += ` until ${format(new Date(until), 'MMM d, yyyy')}`;
    }

    return text;
  }

  return (
    <div className="event-selection-view">
      <CloseButton onClick={goHome} title="Go to Home" />
      <div className="selection-header">
        <h2 className="selection-title">Multiple Events Found</h2>
        <div className="selection-subtitle-row">
          <p className="selection-subtitle">
            Select events to add
          </p>
          <div className="selection-select-all-top">
            <input
              type="checkbox"
              id="selectAllTop"
              checked={selectedIndices.size === events.length && events.length > 0}
              onChange={handleSelectAll}
            />
            <label htmlFor="selectAllTop">Select All</label>
          </div>
        </div>
        <p className="selection-capture-hint">
          Missing events? Scroll the page to show more, zoom out (Ctrl/Cmd -), then click "Capture More"
        </p>
      </div>

      {notice && (
        <div className="selection-notice" onClick={() => setNotice(null)}>
          {notice}
        </div>
      )}

      <div className="selection-list">
        {events.map((event, index) => (
          <Card
            key={index}
            className={`selection-card ${selectedIndices.has(index) ? 'selection-card-selected' : ''}`}
            onClick={() => handleToggleEvent(index)}
          >
            <div className="selection-card-header">
              <h3 className="selection-card-title">
                {event.title}
                {event.recurrence && (
                  <span className="recurring-badge"> RECURRING</span>
                )}
              </h3>
            </div>

            <div className="selection-card-date">
              {formatEventDate(event)}
            </div>

            {event.recurrence && (
              <div className="selection-card-recurrence">
                {formatRecurrence(event)}
              </div>
            )}

            {event.location && (
              <div className="selection-card-location">
                LOC: {event.location}
              </div>
            )}

            {event.description && (
              <div className="selection-card-description">
                {event.description.substring(0, 100)}
                {event.description.length > 100 && '...'}
              </div>
            )}

            {selectedIndices.has(index) && (
              <div className="selection-card-checkmark">
                ✓
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="selection-actions">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Back
        </Button>
        <Button
          variant="outline"
          onClick={captureMore}
          loading={capturingMore}
        >
          Capture More
        </Button>
        <Button
          disabled={selectedIndices.size === 0}
          onClick={handleContinue}
        >
          {selectedIndices.size === 0
            ? 'Continue'
            : `Continue (${selectedIndices.size})`}
        </Button>
      </div>
    </div>
  );
}

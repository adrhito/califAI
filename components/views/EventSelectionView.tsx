import { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useAppState } from '../../hooks/useAppState';
import { CalifyEvent } from '../../types/event';
import { format } from 'date-fns';
import './EventSelectionView.css';

export default function EventSelectionView() {
  const { events, setCurrentEvent, setSelectedEventIndices, setView } = useAppState();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  function handleToggleEvent(index: number) {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
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
      setView('review');
    }
  }

  function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.8) return <Badge variant="success" size="sm">High</Badge>;
    if (confidence >= 0.6) return <Badge variant="warning" size="sm">Medium</Badge>;
    return <Badge variant="error" size="sm">Low</Badge>;
  }

  function formatEventDate(event: CalifyEvent) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (event.isAllDay) {
      return format(startDate, 'MMMM d, yyyy');
    }

    return `${format(startDate, 'MMM d, yyyy')} at ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  }

  return (
    <div className="event-selection-view">
      <div className="selection-header">
        <h2 className="selection-title">Multiple Events Found</h2>
        <p className="selection-subtitle text-muted">
          Select one or more events to add to your calendar
        </p>
      </div>

      <div className="selection-list">
        {events.map((event, index) => (
          <Card
            key={index}
            className={`selection-card ${selectedIndices.has(index) ? 'selection-card-selected' : ''}`}
            hoverable
            onClick={() => handleToggleEvent(index)}
          >
            <div className="selection-card-header">
              <h3 className="selection-card-title">{event.title}</h3>
              {event.confidence && getConfidenceBadge(event.confidence.overall)}
            </div>

            <div className="selection-card-date text-muted text-sm">
              {formatEventDate(event)}
            </div>

            {event.location && (
              <div className="selection-card-location text-muted text-sm">
                📍 {event.location}
              </div>
            )}

            {event.description && (
              <div className="selection-card-description text-sm">
                {event.description.substring(0, 100)}
                {event.description.length > 100 && '...'}
              </div>
            )}

            {selectedIndices.has(index) && (
              <div className="selection-card-checkmark">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="var(--primary)" />
                  <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="selection-actions">
        <Button
          fullWidth
          disabled={selectedIndices.size === 0}
          onClick={handleContinue}
        >
          {selectedIndices.size === 0
            ? 'Select Events'
            : selectedIndices.size === 1
            ? 'Continue with 1 Event'
            : `Continue with ${selectedIndices.size} Events`}
        </Button>
      </div>
    </div>
  );
}

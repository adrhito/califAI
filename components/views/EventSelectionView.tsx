import { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useAppState } from '../../hooks/useAppState';
import { CalifyEvent } from '../../types/event';
import { format } from 'date-fns';
import './EventSelectionView.css';

export default function EventSelectionView() {
  const { events, setCurrentEvent, setView } = useAppState();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleSelectEvent(index: number) {
    setSelectedIndex(index);
  }

  function handleContinue() {
    if (selectedIndex !== null) {
      setCurrentEvent(events[selectedIndex]);
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
          Select which event you'd like to add to your calendar
        </p>
      </div>

      <div className="selection-list">
        {events.map((event, index) => (
          <Card
            key={index}
            className={`selection-card ${selectedIndex === index ? 'selection-card-selected' : ''}`}
            hoverable
            onClick={() => handleSelectEvent(index)}
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

            {selectedIndex === index && (
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
          disabled={selectedIndex === null}
          onClick={handleContinue}
        >
          Continue with Selected Event
        </Button>
      </div>
    </div>
  );
}

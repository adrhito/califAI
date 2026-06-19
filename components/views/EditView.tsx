import { useAppState } from '../../hooks/useAppState';
import CloseButton from '../ui/CloseButton';
import EventForm from '../forms/EventForm';
import { CalifyEvent } from '../../types/event';
import './EditView.css';

export default function EditView() {
  const {
    currentEvent,
    events,
    editingEventIndex,
    setCurrentEvent,
    setEvents,
    setEditingEventIndex,
    setView,
    goBack,
    goHome
  } = useAppState();

  if (!currentEvent) {
    return null;
  }

  function handleSave(updatedEvent: CalifyEvent) {
    setCurrentEvent(updatedEvent);

    // If we're editing within a multi-event selection, update the events array
    if (editingEventIndex !== null) {
      const newEvents = [...events];
      newEvents[editingEventIndex] = updatedEvent;
      setEvents(newEvents);
    }

    // Clear editing index and return to review
    setEditingEventIndex(null);
    setView('review');
  }

  function handleCancel() {
    goBack();
  }

  return (
    <div className="edit-view">
      <CloseButton onClick={goHome} title="Go to Home" />
      <div className="edit-header">
        <h2 className="edit-title">Edit Event</h2>
        <p className="edit-subtitle text-muted">
          Make changes to the event details
        </p>
      </div>

      <div className="edit-content">
        <EventForm
          event={currentEvent}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

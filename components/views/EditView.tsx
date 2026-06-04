import { useAppState } from '../../hooks/useAppState';
import EventForm from '../forms/EventForm';
import { CalifyEvent } from '../../types/event';
import './EditView.css';

export default function EditView() {
  const { currentEvent, setCurrentEvent, setView } = useAppState();

  if (!currentEvent) {
    return null;
  }

  function handleSave(updatedEvent: CalifyEvent) {
    setCurrentEvent(updatedEvent);
    setView('review');
  }

  function handleCancel() {
    setView('review');
  }

  return (
    <div className="edit-view">
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

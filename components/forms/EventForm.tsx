import React, { useState } from 'react';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { CalifyEvent } from '../../types/event';
import { formatDateForInput, formatTimeForInput, combineDateAndTime, COMMON_TIMEZONES } from '../../lib/utils/date';
import './EventForm.css';

interface EventFormProps {
  event: CalifyEvent;
  onSave: (event: CalifyEvent) => void;
  onCancel: () => void;
}

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    startDate: formatDateForInput(event.startDate),
    startTime: event.isAllDay ? '09:00' : formatTimeForInput(event.startDate),
    endDate: formatDateForInput(event.endDate),
    endTime: event.isAllDay ? '17:00' : formatTimeForInput(event.endDate),
    timezone: event.timezone,
    isAllDay: event.isAllDay
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(field: string, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    // Validate end is after start
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);
    if (end <= start) {
      newErrors.endDate = 'End date/time must be after start';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const updatedEvent: CalifyEvent = {
      ...event,
      title: formData.title,
      description: formData.description || undefined,
      location: formData.location || undefined,
      startDate: formData.isAllDay
        ? `${formData.startDate}T00:00:00`
        : combineDateAndTime(formData.startDate, formData.startTime),
      endDate: formData.isAllDay
        ? `${formData.endDate}T00:00:00`
        : combineDateAndTime(formData.endDate, formData.endTime),
      timezone: formData.timezone,
      isAllDay: formData.isAllDay
    };

    onSave(updatedEvent);
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
        fullWidth
        required
      />

      <TextArea
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        fullWidth
        rows={3}
      />

      <Input
        label="Location"
        value={formData.location}
        onChange={(e) => handleChange('location', e.target.value)}
        fullWidth
      />

      <div className="form-checkbox">
        <input
          type="checkbox"
          id="isAllDay"
          checked={formData.isAllDay}
          onChange={(e) => handleChange('isAllDay', e.target.checked)}
        />
        <label htmlFor="isAllDay">All-day event</label>
      </div>

      <div className="form-row">
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          error={errors.startDate}
          fullWidth
          required
        />
        {!formData.isAllDay && (
          <Input
            label="Start Time"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            fullWidth
            required
          />
        )}
      </div>

      <div className="form-row">
        <Input
          label="End Date"
          type="date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          error={errors.endDate}
          fullWidth
          required
        />
        {!formData.isAllDay && (
          <Input
            label="End Time"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            fullWidth
            required
          />
        )}
      </div>

      <Select
        label="Timezone"
        value={formData.timezone}
        onChange={(e) => handleChange('timezone', e.target.value)}
        options={COMMON_TIMEZONES}
        fullWidth
      />

      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button type="submit" fullWidth>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

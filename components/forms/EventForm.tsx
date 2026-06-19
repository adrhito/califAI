import React, { useState, useRef, useEffect } from 'react';
import Input from '../ui/Input';
import DateInput from '../ui/DateInput';
import TimeInput from '../ui/TimeInput';
import Calendar from '../ui/Calendar';
import TimePicker from '../ui/TimePicker';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import RecurrenceEditor from './RecurrenceEditor';
import { CalifyEvent, RecurrenceRule } from '../../types/event';
import { formatDateForInput, formatTimeForInput, combineDateAndTime } from '../../lib/utils/date';
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
    isAllDay: event.isAllDay
  });

  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(event.recurrence || null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openCalendar, setOpenCalendar] = useState<'start' | 'end' | null>(null);
  const [openTimePicker, setOpenTimePicker] = useState<'start' | 'end' | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openCalendar && calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [openCalendar]);

  useEffect(() => {
    if (openTimePicker && timePickerRef.current) {
      timePickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [openTimePicker]);

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
      isAllDay: formData.isAllDay,
      recurrence: recurrence || undefined
    };

    onSave(updatedEvent);
  }

  function handleCalendarChange(date: string) {
    if (openCalendar === 'start') {
      handleChange('startDate', date);
    } else if (openCalendar === 'end') {
      handleChange('endDate', date);
    }
    setOpenCalendar(null);
  }

  function handleTimePickerChange(time: string) {
    if (openTimePicker === 'start') {
      handleChange('startTime', time);
    } else if (openTimePicker === 'end') {
      handleChange('endTime', time);
    }
    setOpenTimePicker(null);
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
        <DateInput
          label="Start Date"
          value={formData.startDate}
          onChange={(value) => handleChange('startDate', value)}
          error={errors.startDate}
          fullWidth
          required
          onClick={() => {
            setOpenTimePicker(null);
            setOpenCalendar(openCalendar === 'start' ? null : 'start');
          }}
        />
        {!formData.isAllDay && (
          <TimeInput
            label="Start Time"
            value={formData.startTime}
            onChange={(value) => handleChange('startTime', value)}
            fullWidth
            required
            onClick={() => {
              setOpenCalendar(null);
              setOpenTimePicker(openTimePicker === 'start' ? null : 'start');
            }}
          />
        )}
      </div>

      <div className="form-row">
        <DateInput
          label="End Date"
          value={formData.endDate}
          onChange={(value) => handleChange('endDate', value)}
          fullWidth
          required
          onClick={() => {
            setOpenTimePicker(null);
            setOpenCalendar(openCalendar === 'end' ? null : 'end');
          }}
        />
        {!formData.isAllDay && (
          <TimeInput
            label="End Time"
            value={formData.endTime}
            onChange={(value) => handleChange('endTime', value)}
            fullWidth
            required
            onClick={() => {
              setOpenCalendar(null);
              setOpenTimePicker(openTimePicker === 'end' ? null : 'end');
            }}
          />
        )}
      </div>
      {errors.endDate && (
        <div className="form-error-message">{errors.endDate}</div>
      )}

      {(openCalendar || openTimePicker) && (
        <div className="form-picker-container">
          {openCalendar && (
            <div className="form-calendar-section" ref={calendarRef}>
              <Calendar
                value={openCalendar === 'start' ? formData.startDate : formData.endDate}
                onChange={handleCalendarChange}
                onClose={() => setOpenCalendar(null)}
              />
            </div>
          )}

          {openTimePicker && (
            <div className="form-calendar-section" ref={timePickerRef}>
              <TimePicker
                value={openTimePicker === 'start' ? formData.startTime : formData.endTime}
                onChange={handleTimePickerChange}
                onClose={() => setOpenTimePicker(null)}
              />
            </div>
          )}
        </div>
      )}

      <RecurrenceEditor
        value={recurrence}
        onChange={setRecurrence}
        startDate={formData.startDate}
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

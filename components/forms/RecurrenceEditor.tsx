import React from 'react';
import Select from '../ui/Select';
import Input from '../ui/Input';
import DateInput from '../ui/DateInput';
import { RecurrenceRule, RecurrenceFrequency } from '../../types/event';
import { formatDateForInput } from '../../lib/utils/date';
import './RecurrenceEditor.css';

interface RecurrenceEditorProps {
  value: RecurrenceRule | null | undefined;
  onChange: (recurrence: RecurrenceRule | null) => void;
  startDate: string;
}

const WEEKDAYS = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' }
];

export default function RecurrenceEditor({ value, onChange, startDate }: RecurrenceEditorProps) {
  const [isRecurring, setIsRecurring] = React.useState(!!value);
  const [frequency, setFrequency] = React.useState<RecurrenceFrequency>(value?.frequency || 'WEEKLY');
  const [interval, setInterval] = React.useState(value?.interval || 1);
  const [byDay, setByDay] = React.useState<string[]>(value?.byDay || []);
  const [endType, setEndType] = React.useState<'never' | 'count' | 'until'>(
    value?.count ? 'count' : value?.until ? 'until' : 'never'
  );
  const [count, setCount] = React.useState(value?.count || 10);
  const [until, setUntil] = React.useState(
    value?.until ? formatDateForInput(value.until) : formatDateForInput(new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())
  );

  React.useEffect(() => {
    if (!isRecurring) {
      onChange(null);
      return;
    }

    const recurrence: RecurrenceRule = {
      frequency,
      interval: interval > 1 ? interval : undefined,
      byDay: frequency === 'WEEKLY' && byDay.length > 0 ? byDay : undefined,
      count: endType === 'count' ? count : undefined,
      until: endType === 'until' ? `${until}T23:59:59` : undefined
    };

    onChange(recurrence);
  }, [isRecurring, frequency, interval, byDay, endType, count, until]);

  function toggleRecurring() {
    setIsRecurring(!isRecurring);
  }

  function toggleWeekday(day: string) {
    if (byDay.includes(day)) {
      setByDay(byDay.filter(d => d !== day));
    } else {
      setByDay([...byDay, day].sort((a, b) => {
        const order = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        return order.indexOf(a) - order.indexOf(b);
      }));
    }
  }

  return (
    <div className="recurrence-editor">
      <div className="recurrence-header">
        <label className="recurrence-toggle">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={toggleRecurring}
          />
          <span>Recurring Event</span>
        </label>
      </div>

      {isRecurring && (
        <div className="recurrence-settings">
          <div className="recurrence-row">
            <span className="recurrence-label">Repeat every</span>
            <Input
              type="number"
              value={interval.toString()}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{ width: '60px' }}
            />
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              options={[
                { value: 'DAILY', label: interval === 1 ? 'day' : 'days' },
                { value: 'WEEKLY', label: interval === 1 ? 'week' : 'weeks' },
                { value: 'MONTHLY', label: interval === 1 ? 'month' : 'months' },
                { value: 'YEARLY', label: interval === 1 ? 'year' : 'years' }
              ]}
              style={{ flex: 1 }}
            />
          </div>

          {frequency === 'WEEKLY' && (
            <div className="recurrence-weekdays">
              <span className="recurrence-label">Repeat on</span>
              <div className="weekday-buttons">
                {WEEKDAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`weekday-button ${byDay.includes(value) ? 'weekday-button-selected' : ''}`}
                    onClick={() => toggleWeekday(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="recurrence-end">
            <span className="recurrence-label">Ends</span>
            <div className="recurrence-end-options">
              <div className="recurrence-end-option">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                />
                <span style={{ cursor: 'pointer' }} onClick={() => setEndType('never')}>Never</span>
              </div>

              <div className="recurrence-end-option">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'count'}
                  onChange={() => setEndType('count')}
                />
                <span style={{ cursor: 'pointer' }} onClick={() => setEndType('count')}>After</span>
                <Input
                  type="number"
                  value={count.toString()}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={endType !== 'count'}
                  min="1"
                  style={{ width: '60px', marginLeft: '8px' }}
                />
                <span style={{ marginLeft: '4px' }}>occurrences</span>
              </div>

              <div className="recurrence-end-option">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'until'}
                  onChange={() => setEndType('until')}
                />
                <span style={{ cursor: 'pointer' }} onClick={() => setEndType('until')}>On</span>
                <div style={{ width: '140px', marginLeft: '8px', opacity: endType !== 'until' ? 0.5 : 1, pointerEvents: endType !== 'until' ? 'none' : 'auto' }}>
                  <DateInput
                    label=""
                    value={until}
                    onChange={setUntil}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TimeSlotPicker - Date picker and start/end time selection with 30-min resolution
 * Controlled component that receives state via props and notifies parent of changes
 */

import { useState, useCallback } from 'react';
import { TIME_OPTIONS, SLOT_CONSTANTS } from '../utils/timeSlotUtils';
import { api } from '../services/api';

export interface TimeSlotPickerProps {
  /** Selected date (controlled) */
  date: string;

  /** Selected start time (controlled) */
  startTime: string;

  /** Selected end time (controlled) */
  endTime: string;

  /** Handler for date changes */
  onDateChange: (date: string) => void;

  /** Handler for start time changes */
  onStartTimeChange: (startTime: string) => void;

  /** Handler for end time changes */
  onEndTimeChange: (endTime: string) => void;

  /** Disable inputs during loading */
  disabled?: boolean;
}

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-end',
    marginBottom: '20px',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  } as React.CSSProperties,
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  input: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '150px',
  } as React.CSSProperties,
  inputDisabled: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '150px',
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '100px',
    backgroundColor: '#fff',
  } as React.CSSProperties,
  selectDisabled: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '100px',
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  duration: {
    fontSize: '14px',
    color: '#666',
    padding: '8px 0',
  } as React.CSSProperties,
  durationSaved: {
    fontSize: '12px',
    color: '#4caf50',
    marginLeft: '8px',
  } as React.CSSProperties,
};

function formatDuration(startTime: string, endTime: string): string {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;

  if (durationMinutes <= 0) return 'Invalid';

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function getDefaultDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function TimeSlotPicker({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
}: TimeSlotPickerProps) {
  const [showSaved, setShowSaved] = useState(false);

  const handleStartTimeChange = useCallback(
    (newStartTime: string) => {
      onStartTimeChange(newStartTime);
    },
    [onStartTimeChange]
  );

  const handleEndTimeChange = useCallback(
    (newEndTime: string) => {
      onEndTimeChange(newEndTime);
      // Show saved indicator briefly
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    },
    [onEndTimeChange]
  );

  const handleDateChange = useCallback(
    (newDate: string) => {
      onDateChange(newDate);
    },
    [onDateChange]
  );

  return (
    <div style={styles.container} className="time-slot-picker-responsive">
      <div style={styles.field}>
        <label style={styles.label}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          style={disabled ? styles.inputDisabled : styles.input}
          min={getDefaultDate()}
          disabled={disabled}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Start Time</label>
        <select
          value={startTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          style={disabled ? styles.selectDisabled : styles.select}
          disabled={disabled}
        >
          {TIME_OPTIONS.slice(0, -1).map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>End Time</label>
        <select
          value={endTime}
          onChange={(e) => handleEndTimeChange(e.target.value)}
          style={disabled ? styles.selectDisabled : styles.select}
          disabled={disabled}
        >
          {TIME_OPTIONS.filter((time) => time > startTime).map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      <div style={styles.duration}>
        Duration: {formatDuration(startTime, endTime)}
        {showSaved && <span style={styles.durationSaved}>✓ Saved</span>}
      </div>
    </div>
  );
}

// Re-export TIME_OPTIONS for backwards compatibility with any code that imports from here
export { TIME_OPTIONS };

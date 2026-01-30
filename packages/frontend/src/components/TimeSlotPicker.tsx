/**
 * TimeSlotPicker - Date picker and start/end time selection with 30-min resolution
 * Fetches smart default time slot from server and saves duration preference
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface TimeSlotPickerProps {
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onChange: (date: string, startTime: string, endTime: string) => void;
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
  select: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '100px',
    backgroundColor: '#fff',
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

// Generate time options at 30-minute intervals
function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(time);
    }
  }
  return times;
}

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

function calculateDurationMins(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

function getDefaultDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getDefaultStartTime(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  // Round up to next 30-minute mark, then add 30 minutes
  const roundedMinutes = minutes < 30 ? 30 : 0;
  const roundedHours = minutes < 30 ? hours : hours + 1;
  const targetHours = roundedMinutes === 0 ? roundedHours : roundedHours;
  const targetMinutes = roundedMinutes === 0 ? 30 : roundedMinutes + 30;

  const finalHours = targetMinutes >= 60 ? targetHours + 1 : targetHours;
  const finalMinutes = targetMinutes >= 60 ? targetMinutes - 60 : targetMinutes;

  // Clamp to available range
  if (finalHours < 5) return '05:00';
  if (finalHours >= 22) return '21:00';

  return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}

function getDefaultEndTime(startTime: string, durationMins = 60): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMins;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  // Clamp to available range
  if (endHours >= 22 && endMinutes > 0) return '22:00';

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

const TIME_OPTIONS = generateTimeOptions();

export function TimeSlotPicker({
  initialDate,
  initialStartTime,
  initialEndTime,
  onChange,
}: TimeSlotPickerProps) {
  const [date, setDate] = useState(initialDate || getDefaultDate());
  const [startTime, setStartTime] = useState(initialStartTime || getDefaultStartTime());
  const [endTime, setEndTime] = useState(
    initialEndTime || getDefaultEndTime(initialStartTime || getDefaultStartTime())
  );
  const [savedDuration, setSavedDuration] = useState<number | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch default time slot from server on mount
  useEffect(() => {
    if (!initialDate && !initialStartTime && !initialEndTime) {
      api.getDefaultTimeSlot()
        .then((defaultSlot) => {
          setDate(defaultSlot.date);
          setStartTime(defaultSlot.startTime);
          setEndTime(defaultSlot.endTime);
          setSavedDuration(defaultSlot.durationMins);
          setInitialized(true);
        })
        .catch((err) => {
          console.warn('Failed to fetch default time slot:', err);
          setInitialized(true);
        });
    } else {
      setInitialized(true);
    }
  }, []); // Only run on mount

  // Notify parent of changes
  useEffect(() => {
    if (initialized) {
      onChange(date, startTime, endTime);
    }
  }, [date, startTime, endTime, initialized, onChange]);

  // Save duration preference when user changes end time
  const saveDurationPreference = useCallback((newDuration: number) => {
    if (savedDuration !== newDuration && newDuration >= 30 && newDuration <= 480 && newDuration % 30 === 0) {
      api.updatePreferences(newDuration)
        .then(() => {
          setSavedDuration(newDuration);
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2000);
        })
        .catch((err) => {
          console.warn('Failed to save duration preference:', err);
        });
    }
  }, [savedDuration]);

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    // Automatically adjust end time using saved duration
    const newEndTime = getDefaultEndTime(newStartTime, savedDuration || 60);
    setEndTime(newEndTime);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    // Save the new duration preference
    const newDuration = calculateDurationMins(startTime, newEndTime);
    saveDurationPreference(newDuration);
  };

  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label style={styles.label}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
          min={getDefaultDate()}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Start Time</label>
        <select
          value={startTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          style={styles.select}
        >
          {TIME_OPTIONS.map((time) => (
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
          style={styles.select}
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

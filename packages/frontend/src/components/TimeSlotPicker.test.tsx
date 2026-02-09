import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimeSlotPicker } from './TimeSlotPicker';

describe('TimeSlotPicker (009-US4)', () => {
  it('renders .time-slot-picker-responsive container', () => {
    const { container } = render(
      <TimeSlotPicker
        date="2026-02-08"
        startTime="10:00"
        endTime="11:00"
        onDateChange={vi.fn()}
        onStartTimeChange={vi.fn()}
        onEndTimeChange={vi.fn()}
      />
    );
    expect(container.querySelector('.time-slot-picker-responsive')).toBeInTheDocument();
  });
});

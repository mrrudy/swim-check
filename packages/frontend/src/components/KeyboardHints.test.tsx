import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyboardHints } from './KeyboardHints';

describe('KeyboardHints', () => {
  describe('standard mode', () => {
    it('should render navigation and duration hints by default', () => {
      render(<KeyboardHints />);

      expect(screen.getByText(/← → navigate slots/i)).toBeInTheDocument();
      expect(screen.getByText(/↑ ↓ adjust duration/i)).toBeInTheDocument();
    });

    it('should hide navigation hints when showNavigation is false', () => {
      render(<KeyboardHints showNavigation={false} />);

      expect(screen.queryByText(/navigate slots/i)).not.toBeInTheDocument();
      expect(screen.getByText(/↑ ↓ adjust duration/i)).toBeInTheDocument();
    });

    it('should hide duration hints when showDuration is false', () => {
      render(<KeyboardHints showDuration={false} />);

      expect(screen.getByText(/← → navigate slots/i)).toBeInTheDocument();
      expect(screen.queryByText(/adjust duration/i)).not.toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should render compact hints', () => {
      render(<KeyboardHints compact />);

      expect(screen.getByText(/←→/)).toBeInTheDocument();
      expect(screen.getByText(/↑↓/)).toBeInTheDocument();
    });

    it('should only show navigation in compact mode when showDuration is false', () => {
      render(<KeyboardHints compact showDuration={false} />);

      expect(screen.getByText(/←→/)).toBeInTheDocument();
      expect(screen.queryByText(/↑↓/)).not.toBeInTheDocument();
    });
  });
});

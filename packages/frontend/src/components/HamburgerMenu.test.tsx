import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HamburgerMenu } from './HamburgerMenu';

function renderMenu() {
  return render(
    <MemoryRouter>
      <HamburgerMenu />
    </MemoryRouter>
  );
}

describe('HamburgerMenu', () => {
  it('renders toggle button with ☰ text', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(button).toBeDefined();
    expect(button.textContent).toContain('☰');
  });

  it('opens dropdown on click', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });

    // Menu should be closed initially
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes on item click', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // Click a nav item
    const favoritesLink = screen.getByText('Favorites');
    fireEvent.click(favoritesLink);

    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on outside click (mousedown)', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // Click outside the menu
    fireEvent.mouseDown(document.body);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape key', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('has all 3 nav items', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });
    fireEvent.click(button);

    expect(screen.getByText('Favorites')).toBeDefined();
    expect(screen.getByText('Search Pools')).toBeDefined();
    expect(screen.getByText('Scraping Status')).toBeDefined();
  });

  it('has correct ARIA attributes', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('mobile-menu');
    expect(button.getAttribute('aria-label')).toBe('Toggle navigation menu');

    const nav = document.getElementById('mobile-menu');
    expect(nav).toBeDefined();
    expect(nav?.getAttribute('role')).toBe('navigation');
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('returns focus to button on Escape', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });

    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(button);
  });
});

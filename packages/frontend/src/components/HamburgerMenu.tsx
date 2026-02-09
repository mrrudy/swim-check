import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const styles = {
  container: {
    position: 'relative',
  } as React.CSSProperties,
  button: {
    minWidth: '48px',
    minHeight: '48px',
    padding: '8px 12px',
    fontSize: '16px',
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } as React.CSSProperties,
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    transition: 'max-height 0.2s ease-in-out',
    zIndex: 100,
  } as React.CSSProperties,
  link: {
    display: 'block',
    padding: '12px 24px',
    color: '#0066cc',
    textDecoration: 'none',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
};

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} style={styles.container} className="nav-hamburger">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        style={styles.button}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        ☰ Menu
      </button>

      <nav
        id="mobile-menu"
        role="navigation"
        aria-label="Main navigation"
        style={{
          ...styles.dropdown,
          maxHeight: isOpen ? '500px' : '0',
          border: isOpen ? '1px solid #ccc' : 'none',
        }}
      >
        <Link to="/" style={styles.link} onClick={handleItemClick}>
          Favorites
        </Link>
        <Link to="/search" style={styles.link} onClick={handleItemClick}>
          Search Pools
        </Link>
        <Link to="/scraping-status" style={{ ...styles.link, borderBottom: 'none' }} onClick={handleItemClick}>
          Scraping Status
        </Link>
      </nav>
    </div>
  );
}

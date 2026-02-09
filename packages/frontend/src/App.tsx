import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { PoolDetail } from './pages/PoolDetail';
import { ScrapingStatus } from './pages/ScrapingStatus';
import { HamburgerMenu } from './components/HamburgerMenu';
import { useMediaQuery } from './hooks/useMediaQuery';

const styles = {
  app: {
    minHeight: '100vh',
    padding: '20px',
  } as React.CSSProperties,
  header: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  nav: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  } as React.CSSProperties,
  navLink: {
    color: '#0066cc',
    textDecoration: 'none',
    fontSize: '14px',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0',
  } as React.CSSProperties,
};

export function App() {
  const isMobile = useMediaQuery('(max-width: 799px)');

  return (
    <BrowserRouter>
      <div style={styles.app} className="app-container">
        <header style={styles.header} className="app-header">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={styles.title} className="app-title">Swim Check</h1>
          </Link>
          <p style={styles.subtitle} className="app-subtitle">Check lane availability at your favorite pools</p>
          {isMobile ? (
            <HamburgerMenu />
          ) : (
            <nav style={styles.nav} className="nav-inline">
              <Link to="/" style={styles.navLink}>
                Favorites
              </Link>
              <Link to="/search" style={styles.navLink}>
                Search Pools
              </Link>
              <Link to="/scraping-status" style={styles.navLink}>
                Scraping Status
              </Link>
            </nav>
          )}
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/pools/:poolId" element={<PoolDetail />} />
            <Route path="/scraping-status" element={<ScrapingStatus />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

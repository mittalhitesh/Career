import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import styles from './Header.module.css';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/chat', label: 'Chat' },
  { to: '/explore', label: 'Explore' },
  { to: '/roadmap/software-engineer', label: 'Roadmaps', matchPrefix: '/roadmap' },
  { to: '/about', label: 'About' },
];

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { settings, isConfigured, providerLabel } = useSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const badgeText =
    settings.provider === 'mock'
      ? 'Mock'
      : isConfigured
        ? providerLabel
        : `${providerLabel} (setup needed)`;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">[M_]</span>
          <span className={styles.brandName}>Career Mitar AI</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_LINKS.map((item) => {
            const isRoadmapActive =
              item.matchPrefix && location.pathname.startsWith(item.matchPrefix);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive || isRoadmapActive ? styles.active : ''}`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <Link
            to="/settings"
            className={`${styles.statusBadge} ${!isConfigured ? styles.statusWarn : ''}`}
            title="AI Provider Settings"
          >
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusLabel}>{badgeText}</span>
          </Link>

          <button
            type="button"
            className={`btn btn-ghost ${styles.iconBtn}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>

          <Link
            to="/settings"
            className={`btn btn-ghost ${styles.iconBtn}`}
            aria-label="Provider settings"
            title="Settings"
          >
            <span aria-hidden="true">⚙</span>
          </Link>

          <button
            type="button"
            className={`btn btn-ghost ${styles.menuBtn}`}
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span aria-hidden="true">{drawerOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div id="mobile-nav-drawer" className={styles.drawer} role="dialog" aria-label="Mobile navigation">
          <nav className={styles.drawerNav}>
            {NAV_LINKS.map((item) => {
              const isRoadmapActive =
                item.matchPrefix && location.pathname.startsWith(item.matchPrefix);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.drawerLink} ${isActive || isRoadmapActive ? styles.active : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `${styles.drawerLink} ${isActive ? styles.active : ''}`
              }
            >
              Settings ({badgeText})
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

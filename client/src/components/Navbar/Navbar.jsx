import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

const LANGS = ['ru', 'kz', 'en'];

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { lang, switchLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => { setNavOpen(false); setDropdownOpen(false); };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeAll();
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" onClick={closeAll}>
          <span className="navbar__logo-icon">🚌</span>
          <span className="navbar__logo-text">
            <span className="navbar__logo-main">Астана</span>
            <span className="navbar__logo-sub">Транзит</span>
          </span>
        </Link>

        <div className="navbar__links hide-mobile">
          <NavLink to="/" end className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>{t('nav.home')}</NavLink>
          <NavLink to="/routes" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>{t('nav.routes')}</NavLink>
          <NavLink to="/search" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>{t('nav.search')}</NavLink>
          {user && <NavLink to="/favorites" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>⭐ {t('nav.favorites')}</NavLink>}
          {isAdmin && <NavLink to="/admin" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>{t('nav.admin')}</NavLink>}
        </div>

        <div className="navbar__right">
          {/* Theme toggle */}
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="lang-switcher">
            {LANGS.map((l) => (
              <button key={l} id={`lang-btn-${l}`} className={`lang-btn ${lang === l ? 'lang-btn--active' : ''}`} onClick={() => switchLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {user ? (
            <div className="navbar__user-menu" ref={dropdownRef}>
              <button id="user-menu-btn" className="navbar__user-btn" onClick={() => setDropdownOpen((v) => !v)} aria-expanded={dropdownOpen}>
                <span className="navbar__avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="navbar__user-name hide-mobile">{user.name}</span>
                <span className="navbar__chevron">{dropdownOpen ? '▲' : '▼'}</span>
              </button>
              {dropdownOpen && (
                <div className="navbar__dropdown animate-fade-in-scale">
                  <div className="navbar__dropdown-header">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    {isAdmin && <span className="admin-badge">ADMIN</span>}
                  </div>
                  <div className="navbar__dropdown-divider" />
                  <Link to="/favorites" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>⭐ {t('nav.favorites')}</Link>
                  {isAdmin && <Link to="/admin" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>🛠 {t('nav.admin')}</Link>}
                  <button id="logout-btn" className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>🚪 {t('nav.logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth-btns hide-mobile">
              <Link to="/login" className="btn btn-secondary btn-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
            </div>
          )}

          <button id="mobile-menu-btn" className="navbar__hamburger" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu">
            <span className={`hamburger-line ${navOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${navOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${navOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {navOpen && (
        <div className="navbar__mobile-menu animate-fade-in">
          <NavLink to="/" end className="mobile-link" onClick={() => setNavOpen(false)}>{t('nav.home')}</NavLink>
          <NavLink to="/routes" className="mobile-link" onClick={() => setNavOpen(false)}>{t('nav.routes')}</NavLink>
          <NavLink to="/search" className="mobile-link" onClick={() => setNavOpen(false)}>{t('nav.search')}</NavLink>
          {user && <NavLink to="/favorites" className="mobile-link" onClick={() => setNavOpen(false)}>⭐ {t('nav.favorites')}</NavLink>}
          {isAdmin && <NavLink to="/admin" className="mobile-link" onClick={() => setNavOpen(false)}>{t('nav.admin')}</NavLink>}
          <div className="mobile-divider" />
          {user ? (
            <button className="mobile-link mobile-link--danger" onClick={handleLogout}>{t('nav.logout')}</button>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setNavOpen(false)}>{t('nav.login')}</Link>
              <Link to="/register" className="mobile-link mobile-link--primary" onClick={() => setNavOpen(false)}>{t('nav.register')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

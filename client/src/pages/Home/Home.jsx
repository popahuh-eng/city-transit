import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routesAPI, statsAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import RouteCard from '../../components/RouteCard/RouteCard';
import Loader from '../../components/Loader/Loader';
import './Home.css';

const STAT_ICONS = ['🚌', '📍', '🕐', '🏙️'];
const STAT_KEYS  = ['stats_routes', 'stats_stops', 'stats_departures', 'stats_cities'];

const HOW_STEPS = [
  { key: '1', icon: '🔍' },
  { key: '2', icon: '📅' },
  { key: '3', icon: '🚀' },
];

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    routesAPI.getAll()
      .then(r => setRoutes(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    statsAPI.get()
      .then(r => setStats(r.data))
      .catch(console.error);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const popularRoutes = routes.slice(0, 4);

  return (
    <div className="home">
      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
          <div className="hero__grid" />
        </div>
        <div className="container hero__content animate-fade-in">
          <div className="hero__badge">🏙️ Астана • Нур-Султан</div>
          <h1 className="hero__title">{t('home.hero_title')}</h1>
          <p className="hero__subtitle">{t('home.hero_subtitle')}</p>

          {/* Search */}
          <form className="hero__search" onSubmit={handleSearch} id="hero-search-form">
            <div className="hero__search-inner">
              <span className="hero__search-icon">🔍</span>
              <input
                id="hero-search-input"
                className="hero__search-input"
                type="text"
                placeholder={t('home.search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <button id="hero-search-btn" type="submit" className="btn btn-primary">
                {t('home.search_btn')}
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="hero__tags">
            {['Байтерек', 'Хан Шатыр', 'ЭКСПО', 'ЖД Вокзал', 'Аэропорт'].map((tag) => (
              <button
                key={tag}
                className="hero__tag"
                onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STAT_KEYS.map((key, i) => {
              const values = stats ? [stats.routes, stats.stops, stats.departures, stats.districts] : [null,null,null,null];
              return (
                <div key={key} className="stat-card animate-fade-in">
                  <span className="stat-card__icon">{STAT_ICONS[i]}</span>
                  <span className="stat-card__value">{values[i] ?? '...'}</span>
                  <span className="stat-card__label">{t(`home.${key}`)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Popular Routes ───────────────────────────────────────────────────── */}
      <section className="popular-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="page-title">{t('home.popular_routes')}</h2>
              <p className="page-subtitle">Астана • {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <Link to="/routes" className="btn btn-secondary">{t('home.all_routes')} →</Link>
          </div>

          {loading ? (
            <Loader text={t('routes.loading')} />
          ) : (
            <div className="routes-grid">
              {popularRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── How to use ───────────────────────────────────────────────────────── */}
      <section className="how-section">
        <div className="container">
          <h2 className="page-title text-center">{t('home.how_title')}</h2>
          <div className="how-grid">
            {HOW_STEPS.map((step, i) => (
              <div key={step.key} className="how-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="how-card__step">{i + 1}</div>
                <div className="how-card__icon">{step.icon}</div>
                <h3 className="how-card__title">{t(`home.how_${step.key}_title`)}</h3>
                <p className="how-card__desc">{t(`home.how_${step.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <span>🚌 {t('footer.brand')}</span>
            <p>{t('footer.tagline')}</p>
          </div>
          <div className="footer__links">
            <Link to="/routes">{t('footer.routes')}</Link>
            <Link to="/search">{t('footer.search')}</Link>
            <Link to="/register">{t('footer.register')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

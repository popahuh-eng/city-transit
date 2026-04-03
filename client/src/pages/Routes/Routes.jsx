import { useState, useEffect } from 'react';
import { routesAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import RouteCard from '../../components/RouteCard/RouteCard';
import Loader from '../../components/Loader/Loader';
import './Routes.css';

const FILTERS = [
  { key: 'all',         label: 'routes.filter_all' },
  { key: 'bus',         label: 'routes.filter_bus' },
  { key: 'trolleybus',  label: 'routes.filter_trolleybus' },
  { key: 'tram',        label: 'routes.filter_tram' },
];

export default function RoutesPage() {
  const { t } = useLanguage();
  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setError(null);
        const res = await routesAPI.getAll();
        setRoutes(res.data);
      } catch (err) {
        setError(t('common.error'));
        console.error('Failed to fetch routes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const filtered = filter === 'all' ? routes : routes.filter((r) => r.type === filter);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <h1 className="page-title">{t('routes.title')}</h1>
        <p className="page-subtitle">{t('routes.subtitle')}</p>

        {/* Filter Tabs */}
        <div className="routes-filters" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              id={`filter-${f.key}`}
              role="tab"
              aria-selected={filter === f.key}
              className={`filter-btn ${filter === f.key ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {t(f.label)}
              {f.key !== 'all' && (
                <span className="filter-btn__count">
                  {routes.filter((r) => r.type === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <Loader text={t('routes.loading')} />
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>{t('common.error')}</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>{t('routes.no_routes')}</h3>
          </div>
        ) : (
          <div className="routes-page-grid animate-fade-in">
            {filtered.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

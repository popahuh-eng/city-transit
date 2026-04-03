import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { searchAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../../components/Loader/Loader';
import './Search.css';

const TYPE_ICONS = { bus: '🚌', trolleybus: '⚡', tram: '🚋' };

export default function Search() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery]           = useState(initialQ);
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [showSugg, setShowSugg]     = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const suggRef     = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggRef.current && !suggRef.current.contains(e.target) && e.target !== inputRef.current) {
        setShowSugg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await searchAPI.search(q.trim());
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Autocomplete: debounced fetch on every keystroke
  const fetchSuggestions = (q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) { setSuggestions(null); setShowSugg(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchAPI.search(q.trim());
        setSuggestions(res.data);
        setShowSugg(true);
      } catch { /* silent */ }
    }, 280);
  };

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSugg(false);
    setSearchParams(query ? { q: query } : {});
    doSearch(query);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val) { setResults(null); setSuggestions(null); setShowSugg(false); return; }
    fetchSuggestions(val);
  };

  const pickSuggestion = (routeId) => {
    setShowSugg(false);
    navigate(`/routes/${routeId}`);
  };

  const clearQuery = () => {
    setQuery('');
    setResults(null);
    setSuggestions(null);
    setShowSugg(false);
  };

  // Flatten suggestions for dropdown display
  const suggItems = suggestions
    ? [
        ...(suggestions.routes || []).map(r => ({ type: 'route', id: r.id, label: `${TYPE_ICONS[r.type]} №${r.number} — ${r[`name_${lang}`] || r.name_ru}`, sub: `${r[`from_stop_${lang}`] || r.from_stop_ru} → ${r[`to_stop_${lang}`] || r.to_stop_ru}`, color: r.color })),
        ...(suggestions.stops || []).map(s => ({ type: 'stop', id: s.route_id, label: `📍 ${s[`name_${lang}`] || s.name_ru}`, sub: `Маршрут №${s.route_number}`, color: s.color })),
      ].slice(0, 8)
    : [];

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className="page-title">{t('search.title')}</h1>
        <p className="page-subtitle">{t('search.subtitle')}</p>

        {/* Search Bar */}
        <form className="search-bar-form" onSubmit={handleSubmit} id="search-form">
          <div className="search-bar-wrap" style={{ position: 'relative' }}>
            <span className="search-bar-icon">🔍</span>
            <input
              ref={inputRef}
              id="search-input"
              className="search-bar-input"
              type="text"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={handleChange}
              onFocus={() => suggItems.length > 0 && setShowSugg(true)}
              autoComplete="off"
              autoFocus
            />
            {query && (
              <button type="button" className="search-bar-clear" onClick={clearQuery}>✕</button>
            )}
            <button id="search-submit-btn" type="submit" className="btn btn-primary">
              {loading ? t('search.searching') : t('home.search_btn')}
            </button>

            {/* Autocomplete dropdown */}
            {showSugg && suggItems.length > 0 && (
              <div ref={suggRef} className="search-suggestions">
                {suggItems.map((item, i) => (
                  <button
                    key={`${item.id}-${i}`}
                    type="button"
                    className="search-suggestion-item"
                    onClick={() => pickSuggestion(item.id)}
                  >
                    <span className="suggestion-dot" style={{ background: item.color }} />
                    <span className="suggestion-text">
                      <span className="suggestion-label">{item.label}</span>
                      <span className="suggestion-sub">{item.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <Loader text={t('search.searching')} />
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>{error}</h3>
          </div>
        ) : results === null ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>{t('search.start')}</h3>
          </div>
        ) : results.total === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">😔</div>
            <h3>{t('search.no_results')}</h3>
            <p>"{query}"</p>
          </div>
        ) : (
          <div className="search-results animate-fade-in">
            <p className="search-results__summary">
              {t('search.results_for')} "<strong>{query}</strong>" — {results.total}
            </p>

            {results.routes.length > 0 && (
              <section className="search-section">
                <h2 className="search-section__title">🚌 {t('search.routes_found')} ({results.routes.length})</h2>
                <div className="search-routes-grid">
                  {results.routes.map((route) => {
                    const nameKey = `name_${lang}`;
                    const fromKey = `from_stop_${lang}`;
                    const toKey   = `to_stop_${lang}`;
                    return (
                      <Link key={route.id} to={`/routes/${route.id}`} className="search-route-card" id={`search-route-${route.id}`}>
                        <div className="search-route-card__accent" style={{ background: route.color }} />
                        <div className="search-route-card__body">
                          <div className="search-route-card__header">
                            <span className="search-route-card__num" style={{ color: route.color }}>
                              {TYPE_ICONS[route.type]} {route.number}
                            </span>
                            <span className={`badge badge-${route.type}`}>{t(`common.${route.type}`)}</span>
                          </div>
                          <p className="search-route-card__name">{route[nameKey] || route.name_ru}</p>
                          <p className="search-route-card__dir">{route[fromKey] || route.from_stop_ru} → {route[toKey] || route.to_stop_ru}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {results.stops.length > 0 && (
              <section className="search-section">
                <h2 className="search-section__title">📍 {t('search.stops_found')} ({results.stops.length})</h2>
                <div className="search-stops-list">
                  {results.stops.map((stop) => {
                    const stopNameKey = `name_${lang}`;
                    return (
                      <Link key={`${stop.route_id}-${stop.id}`} to={`/routes/${stop.route_id}`} className="search-stop-item" id={`search-stop-${stop.id}`}>
                        <div className="search-stop-item__dot" style={{ background: stop.color }} />
                        <div>
                          <p className="search-stop-item__name">{stop[stopNameKey] || stop.name_ru}</p>
                          <p className="search-stop-item__route">{t('search.route_on')} {stop.route_number} ({t(`common.${stop.route_type}`)})</p>
                        </div>
                        <span className="search-stop-item__arrow">→</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

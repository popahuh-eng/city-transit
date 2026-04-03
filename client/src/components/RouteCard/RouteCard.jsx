import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './RouteCard.css';

const TYPE_ICONS = { bus: '🚌', trolleybus: '⚡', tram: '🚋' };

/**
 * Displays a single transit route card with color accent, type badge, and interval.
 * @param {Object} route - Route data object
 */
export default function RouteCard({ route }) {
  const { lang, t } = useLanguage();

  const nameKey = `name_${lang}`;
  const fromKey = `from_stop_${lang}`;
  const toKey   = `to_stop_${lang}`;

  const name     = route[nameKey]  || route.name_ru;
  const fromStop = route[fromKey]  || route.from_stop_ru;
  const toStop   = route[toKey]    || route.to_stop_ru;

  return (
    <Link to={`/routes/${route.id}`} className="route-card" id={`route-card-${route.id}`}>
      {/* Color accent bar */}
      <div className="route-card__accent" style={{ background: route.color }} />

      <div className="route-card__body">
        {/* Header */}
        <div className="route-card__header">
          <div className="route-card__number" style={{ color: route.color, borderColor: route.color }}>
            {TYPE_ICONS[route.type]} {route.number}
          </div>
          <span className={`badge badge-${route.type}`}>
            {t(`common.${route.type}`)}
          </span>
        </div>

        {/* Direction */}
        <div className="route-card__direction">
          <div className="route-card__stop">
            <span className="route-card__stop-dot" style={{ background: route.color }} />
            <span className="route-card__stop-name">{fromStop}</span>
          </div>
          <div className="route-card__line" style={{ borderColor: route.color + '40' }} />
          <div className="route-card__stop">
            <span className="route-card__stop-dot route-card__stop-dot--end" style={{ background: route.color }} />
            <span className="route-card__stop-name">{toStop}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="route-card__footer">
          <span className="route-card__interval">
            🕐 {t('routes.interval')}: <strong>{route.interval_min} {t('routes.minutes')}</strong>
          </span>
          <span className="route-card__cta">{t('routes.view')} →</span>
        </div>
      </div>
    </Link>
  );
}

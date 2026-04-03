import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { routesAPI, schedulesAPI, favoritesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ScheduleTable from '../../components/ScheduleTable/ScheduleTable';
import Loader from '../../components/Loader/Loader';
import './RouteDetail.css';

const TYPE_ICONS = { bus: '🚌', trolleybus: '⚡', tram: '🚋' };

const getNextBus = (schedules) => {
  if (!schedules.length) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const times = schedules
    .filter(s => s.direction === 'forward')
    .map(s => { const [h, m] = s.departure.split(':').map(Number); return h * 60 + m; })
    .sort((a, b) => a - b);
  const next = times.find(t => t >= nowMin);
  if (!next && !times.length) return null;
  const t = next ?? times[0];
  const minsAway = next ? next - nowMin : 24 * 60 - nowMin + times[0];
  const h = String(Math.floor(t / 60)).padStart(2, '0');
  const m = String(t % 60).padStart(2, '0');
  return { time: `${h}:${m}`, minsAway: Math.max(0, minsAway) };
};

export default function RouteDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [route, setRoute]         = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [dayType, setDayType]     = useState('weekday');
  const [loading, setLoading]     = useState(true);
  const [schedLoading, setSchedLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [isFav, setIsFav]         = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setError(null);
        const res = await routesAPI.getById(id);
        setRoute(res.data);
      } catch (err) {
        setError(err.response?.data?.error || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
    if (user) {
      favoritesAPI.check(id)
        .then(r => setIsFav(r.data.isFavorite))
        .catch(() => {});
    }
  }, [id, user]);

  useEffect(() => {
    if (!route) return;
    const fetchSchedules = async () => {
      try {
        setSchedLoading(true);
        const res = await schedulesAPI.getByRoute(id, dayType);
        setSchedules(res.data);
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
      } finally {
        setSchedLoading(false);
      }
    };
    fetchSchedules();
  }, [id, dayType, route]);

  if (loading) return <Loader size="lg" text={t('route_detail.loading')} />;

  if (error || !route) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>{error || t('common.error')}</h3>
            <Link to="/routes" className="btn btn-primary">{t('route_detail.back')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const nameKey = `name_${lang}`;
  const fromKey = `from_stop_${lang}`;
  const toKey   = `to_stop_${lang}`;
  const nextBus = getNextBus(schedules);

  const toggleFav = async () => {
    if (!user) return;
    const prev = isFav;
    setIsFav(!prev);           // optimistic update
    setFavLoading(true);
    try {
      if (prev) await favoritesAPI.remove(id);
      else      await favoritesAPI.add(id);
    } catch (err) {
      setIsFav(prev);          // rollback on error
      console.error('[toggleFav]', err?.response?.data || err.message);
    } finally {
      setFavLoading(false);
    }
  };

  // Build map data from stops with coordinates
  const stopsWithCoords = (route.stops || []).filter(s => s.lat && s.lng);
  const hasMap = stopsWithCoords.length >= 2;
  const mapCenter = hasMap
    ? [stopsWithCoords[Math.floor(stopsWithCoords.length / 2)].lat, stopsWithCoords[Math.floor(stopsWithCoords.length / 2)].lng]
    : [51.1283, 71.4300];
  const polylinePositions = stopsWithCoords.map(s => [s.lat, s.lng]);

  return (
    <div className="page-wrapper">
      <div className="container">
        <Link to="/routes" className="back-link">← {t('route_detail.back')}</Link>

        {/* Route Header */}
        <div className="route-detail__header animate-fade-in" style={{ '--route-color': route.color }}>
          <div className="route-detail__accent" style={{ background: `linear-gradient(135deg, ${route.color}, ${route.color}80)` }} />
          <div className="route-detail__header-content">
            <div className="route-detail__number-wrap">
              <div className="route-detail__number" style={{ color: route.color }}>
                {TYPE_ICONS[route.type]} {route.number}
              </div>
              <span className={`badge badge-${route.type}`}>{t(`common.${route.type}`)}</span>
              {user && (
                <button
                  className={`fav-star-btn ${isFav ? 'fav-star-btn--active' : ''}`}
                  onClick={toggleFav}
                  disabled={favLoading}
                  title={isFav ? 'Убрать из избранного' : 'В избранное'}
                >
                  {isFav ? '⭐' : '☆'}
                </button>
              )}
            </div>
            <h1 className="route-detail__name">{route[nameKey] || route.name_ru}</h1>
            <div className="route-detail__endpoints">
              <div className="route-detail__endpoint">
                <span className="route-detail__endpoint-label">{t('route_detail.from')}</span>
                <span className="route-detail__endpoint-value" style={{ color: route.color }}>{route[fromKey] || route.from_stop_ru}</span>
              </div>
              <div className="route-detail__arrow">→</div>
              <div className="route-detail__endpoint">
                <span className="route-detail__endpoint-label">{t('route_detail.to')}</span>
                <span className="route-detail__endpoint-value" style={{ color: route.color }}>{route[toKey] || route.to_stop_ru}</span>
              </div>
            </div>
            <div className="route-detail__meta">
              <span>🕐 {t('route_detail.interval')}: <strong>{route.interval_min} {t('route_detail.minutes')}</strong></span>
              <span>📍 {route.stops?.length || 0} {t('common.stops')}</span>
            </div>
            {nextBus && (
              <div className="next-bus-banner" style={{ borderColor: route.color + '40', background: route.color + '12' }}>
                <span className="next-bus-icon">🚌</span>
                <div>
                  <span className="next-bus-label">Следующий рейс</span>
                  <span className="next-bus-time" style={{ color: route.color }}>
                    {nextBus.minsAway <= 0 ? 'Отправляется сейчас!' : `через ${nextBus.minsAway} мин (в ${nextBus.time})`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="route-detail__body">
          {/* Map */}
          {hasMap && (
            <div className="route-detail__section animate-fade-in">
              <h2 className="route-detail__section-title">🗺 {t('route_detail.map')}</h2>
              <div className="route-map-wrap">
                <MapContainer center={mapCenter} zoom={13} className="route-map" scrollWheelZoom={false}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  />
                  <Polyline positions={polylinePositions} color={route.color} weight={4} opacity={0.85} />
                  {stopsWithCoords.map((stop, idx) => {
                    const isEndpoint = idx === 0 || idx === stopsWithCoords.length - 1;
                    const stopName = stop[`name_${lang}`] || stop.name_ru;
                    return (
                      <CircleMarker
                        key={stop.id}
                        center={[stop.lat, stop.lng]}
                        radius={isEndpoint ? 10 : 7}
                        color={route.color}
                        fillColor={isEndpoint ? route.color : '#fff'}
                        fillOpacity={1}
                        weight={isEndpoint ? 3 : 2}
                      >
                        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                          <span style={{ fontWeight: isEndpoint ? 700 : 400 }}>
                            #{stop.order_num} {stopName}
                          </span>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Stops */}
          <div className="route-detail__section animate-fade-in">
            <h2 className="route-detail__section-title">📍 {t('route_detail.stops')}</h2>
            <div className="stops-timeline">
              {route.stops?.map((stop, idx) => {
                const stopNameKey = `name_${lang}`;
                return (
                  <div key={stop.id} className="stop-item">
                    <div className="stop-item__left">
                      <div
                        className="stop-item__dot"
                        style={{
                          background: idx === 0 || idx === route.stops.length - 1 ? route.color : 'transparent',
                          borderColor: route.color,
                        }}
                      />
                      {idx < route.stops.length - 1 && (
                        <div className="stop-item__line" style={{ borderColor: route.color + '40' }} />
                      )}
                    </div>
                    <div className="stop-item__content">
                      <span className="stop-item__name">{stop[stopNameKey] || stop.name_ru}</span>
                      <span className="stop-item__order">#{stop.order_num}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div className="route-detail__section animate-fade-in">
            <h2 className="route-detail__section-title">🗓 {t('route_detail.schedule')}</h2>
            <div className="day-toggle">
              <button id="toggle-weekday" className={`day-toggle__btn ${dayType === 'weekday' ? 'day-toggle__btn--active' : ''}`} onClick={() => setDayType('weekday')}>
                📅 {t('route_detail.weekday')}
              </button>
              <button id="toggle-weekend" className={`day-toggle__btn ${dayType === 'weekend' ? 'day-toggle__btn--active' : ''}`} onClick={() => setDayType('weekend')}>
                🌅 {t('route_detail.weekend')}
              </button>
            </div>
            {schedLoading ? <Loader size="sm" /> : <ScheduleTable schedules={schedules} />}
          </div>
        </div>
      </div>
    </div>
  );
}

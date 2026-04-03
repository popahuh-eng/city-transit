import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoritesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../../components/Loader/Loader';
import './Favorites.css';

const TYPE_ICONS = { bus: '🚌', trolleybus: '⚡', tram: '🚋' };

export default function Favorites() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    favoritesAPI.getAll()
      .then(r => setRoutes(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const removeFav = async (routeId) => {
    await favoritesAPI.remove(routeId);
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  if (!user) return (
    <div className="page-wrapper">
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <h3>Войдите, чтобы видеть избранное</h3>
          <Link to="/login" className="btn btn-primary">Войти</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className="page-title">⭐ Избранные маршруты</h1>
        <p className="page-subtitle">Ваши сохранённые маршруты</p>

        {loading ? <Loader /> : routes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⭐</div>
            <h3>Нет избранных маршрутов</h3>
            <p>Добавьте маршруты в избранное, нажав ⭐ на странице маршрута</p>
            <Link to="/routes" className="btn btn-primary">Смотреть маршруты</Link>
          </div>
        ) : (
          <div className="fav-grid animate-fade-in">
            {routes.map(route => {
              const nameKey = `name_${lang}`;
              const fromKey = `from_stop_${lang}`;
              const toKey   = `to_stop_${lang}`;
              return (
                <div key={route.id} className="fav-card">
                  <div className="fav-card__accent" style={{ background: route.color }} />
                  <div className="fav-card__body">
                    <div className="fav-card__header">
                      <span className="fav-card__num" style={{ color: route.color }}>
                        {TYPE_ICONS[route.type]} {route.number}
                      </span>
                      <button className="fav-remove-btn" onClick={() => removeFav(route.id)} title="Удалить из избранного">✕</button>
                    </div>
                    <p className="fav-card__name">{route[nameKey] || route.name_ru}</p>
                    <p className="fav-card__dir">{route[fromKey] || route.from_stop_ru} → {route[toKey] || route.to_stop_ru}</p>
                    <div className="fav-card__footer">
                      <span>🕐 {route.interval_min} мин</span>
                      <Link to={`/routes/${route.id}`} className="btn btn-primary btn-sm">Расписание →</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { routesAPI, schedulesAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../../components/Loader/Loader';
import './Admin.css';

const EMPTY_ROUTE = {
  number: '', type: 'bus', name_ru: '', name_kz: '', name_en: '',
  from_stop_ru: '', from_stop_kz: '', from_stop_en: '',
  to_stop_ru: '', to_stop_kz: '', to_stop_en: '',
  interval_min: 15, color: '#3b82f6',
};
const EMPTY_SCHED = { route_id: '', departure: '', days: 'weekday' };

export default function Admin() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [tab, setTab] = useState('routes');

  // ── Routes state ─────────────────────────────────────────────────────────────
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [form, setForm]           = useState(EMPTY_ROUTE);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors]   = useState({});

  // ── Schedule state ────────────────────────────────────────────────────────────
  const [schedForm, setSchedForm]   = useState(EMPTY_SCHED);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedules, setSchedules]   = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [schedDayType, setSchedDayType]   = useState('weekday');

  // ── Load routes ───────────────────────────────────────────────────────────────
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await routesAPI.getAll();
      setRoutes(res.data);
    } catch (err) {
      toast.error('Не удалось загрузить маршруты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  // ── Load schedules when route selected ───────────────────────────────────────
  useEffect(() => {
    if (!selectedRoute) return;
    const fetch = async () => {
      try {
        const res = await schedulesAPI.getByRoute(selectedRoute, schedDayType);
        setSchedules(res.data);
      } catch { toast.error('Не удалось загрузить расписание'); }
    };
    fetch();
  }, [selectedRoute, schedDayType]);

  // ── Route form validation ─────────────────────────────────────────────────────
  const validateRoute = () => {
    const errs = {};
    if (!form.number.trim()) errs.number = 'Номер маршрута обязателен';
    if (!form.name_ru.trim()) errs.name_ru = 'Название (RU) обязательно';
    if (!form.from_stop_ru.trim()) errs.from_stop_ru = 'Начальная остановка обязательна';
    if (!form.to_stop_ru.trim()) errs.to_stop_ru = 'Конечная остановка обязательна';
    if (!form.interval_min || form.interval_min < 1) errs.interval_min = 'Укажите интервал';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  const openCreate = () => { setEditRoute(null); setForm(EMPTY_ROUTE); setFormErrors({}); setShowForm(true); };
  const openEdit   = (r)  => { setEditRoute(r); setForm({ ...r }); setFormErrors({}); setShowForm(true); };
  const closeForm  = ()   => { setShowForm(false); setEditRoute(null); };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    if (!validateRoute()) return;
    try {
      setFormLoading(true);
      if (editRoute) {
        await routesAPI.update(editRoute.id, form);
        toast.success(t('admin.success_updated'));
      } else {
        await routesAPI.create(form);
        toast.success(t('admin.success_created'));
      }
      closeForm();
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, number) => {
    if (!window.confirm(`${t('admin.confirm_delete')} маршрут №${number}?`)) return;
    try {
      await routesAPI.delete(id);
      toast.success(t('admin.success_deleted'));
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  // ── Schedule form ─────────────────────────────────────────────────────────────
  const handleSchedChange = (e) => setSchedForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSchedSubmit = async (e) => {
    e.preventDefault();
    if (!schedForm.route_id || !schedForm.departure) {
      toast.error('Выберите маршрут и укажите время');
      return;
    }
    try {
      setSchedLoading(true);
      await schedulesAPI.create(schedForm);
      toast.success('Рейс добавлен');
      setSchedForm((p) => ({ ...p, departure: '' }));
      if (selectedRoute === schedForm.route_id && schedDayType === schedForm.days) {
        const res = await schedulesAPI.getByRoute(selectedRoute, schedDayType);
        setSchedules(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка добавления рейса');
    } finally {
      setSchedLoading(false);
    }
  };

  const handleSchedDelete = async (id) => {
    try {
      await schedulesAPI.delete(id);
      toast.success('Рейс удалён');
      setSchedules((p) => p.filter((s) => s.id !== id));
    } catch (err) {
      toast.error('Ошибка удаления рейса');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="page-title">{t('admin.title')}</h1>
            <p className="page-subtitle">{routes.length} {t('admin.routes_count')}</p>
          </div>
          {tab === 'routes' && (
            <button id="add-route-btn" className="btn btn-primary" onClick={openCreate}>
              + {t('admin.add_route')}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button id="tab-routes" className={`admin-tab ${tab === 'routes' ? 'admin-tab--active' : ''}`} onClick={() => setTab('routes')}>
            🚌 {t('admin.routes_tab')}
          </button>
          <button id="tab-schedule" className={`admin-tab ${tab === 'schedule' ? 'admin-tab--active' : ''}`} onClick={() => setTab('schedule')}>
            🗓 {t('admin.schedule_tab')}
          </button>
        </div>

        {/* ── Routes Tab ──────────────────────────────────────────────────────── */}
        {tab === 'routes' && (
          <div className="animate-fade-in">
            {loading ? <Loader /> : (
              <div className="admin-table-wrap">
                <table className="admin-table" id="routes-table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Тип</th>
                      <th>Название</th>
                      <th>Отправление</th>
                      <th>Прибытие</th>
                      <th>Интервал</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((r) => (
                      <tr key={r.id} id={`route-row-${r.id}`}>
                        <td>
                          <span className="route-num-badge" style={{ color: r.color, borderColor: r.color }}>
                            {r.number}
                          </span>
                        </td>
                        <td><span className={`badge badge-${r.type}`}>{t(`common.${r.type}`)}</span></td>
                        <td className="td-name">{r.name_ru}</td>
                        <td className="td-stop">{r.from_stop_ru}</td>
                        <td className="td-stop">{r.to_stop_ru}</td>
                        <td>{r.interval_min} мин</td>
                        <td>
                          <span className={`status-dot ${r.is_active ? 'status-dot--active' : 'status-dot--inactive'}`}>
                            {r.is_active ? '● Активен' : '○ Неактивен'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)} id={`edit-btn-${r.id}`}>
                              ✏️ {t('admin.edit')}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, r.number)} id={`delete-btn-${r.id}`}>
                              🗑 {t('admin.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Schedule Tab ─────────────────────────────────────────────────────── */}
        {tab === 'schedule' && (
          <div className="animate-fade-in admin-sched-layout">
            {/* Add departure form */}
            <div className="admin-card">
              <h2 className="admin-card__title">➕ {t('admin.add_departure')}</h2>
              <form id="schedule-form" onSubmit={handleSchedSubmit}>
                <div className="form-group">
                  <label className="form-label">{t('admin.select_route')}</label>
                  <select id="sched-route-select" name="route_id" className="form-select"
                    value={schedForm.route_id} onChange={handleSchedChange} required>
                    <option value="">{t('admin.select_route')}</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>№{r.number} — {r.name_ru}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.departure_time')}</label>
                  <input id="sched-departure-input" name="departure" type="time" className="form-input"
                    value={schedForm.departure} onChange={handleSchedChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.day_type')}</label>
                  <select id="sched-day-select" name="days" className="form-select"
                    value={schedForm.days} onChange={handleSchedChange}>
                    <option value="weekday">{t('admin.weekday')}</option>
                    <option value="weekend">{t('admin.weekend')}</option>
                  </select>
                </div>
                <button id="sched-submit-btn" type="submit" className="btn btn-primary w-full" disabled={schedLoading}>
                  {schedLoading ? '⏳ ...' : `➕ ${t('admin.add_departure')}`}
                </button>
              </form>
            </div>

            {/* View and delete departures */}
            <div className="admin-card">
              <h2 className="admin-card__title">📅 Просмотр расписания</h2>
              <div className="form-group">
                <label className="form-label">Маршрут</label>
                <select id="view-route-select" className="form-select"
                  value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}>
                  <option value="">Выберите маршрут</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>№{r.number} — {r.name_ru}</option>
                  ))}
                </select>
              </div>
              <div className="day-toggle" style={{ marginBottom: 16 }}>
                <button className={`day-toggle__btn ${schedDayType === 'weekday' ? 'day-toggle__btn--active' : ''}`}
                  onClick={() => setSchedDayType('weekday')} type="button">📅 Будние</button>
                <button className={`day-toggle__btn ${schedDayType === 'weekend' ? 'day-toggle__btn--active' : ''}`}
                  onClick={() => setSchedDayType('weekend')} type="button">🌅 Выходные</button>
              </div>
              {selectedRoute && (
                <div className="sched-times-grid">
                  {schedules.map((s) => (
                    <div key={s.id} className="sched-time-chip">
                      <span>{s.departure}</span>
                      <button className="sched-time-del" onClick={() => handleSchedDelete(s.id)} title="Удалить">×</button>
                    </div>
                  ))}
                  {schedules.length === 0 && <p className="text-muted-small">Нет рейсов</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Route Form Modal ─────────────────────────────────────────────────── */}
        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
              <div className="modal__header">
                <h2>{editRoute ? `✏️ ${t('admin.edit')} №${editRoute.number}` : `➕ ${t('admin.add_route')}`}</h2>
                <button className="modal__close" onClick={closeForm}>✕</button>
              </div>
              <form id="route-form" onSubmit={handleRouteSubmit} className="modal__body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('admin.route_number')} *</label>
                    <input name="number" className={`form-input ${formErrors.number ? 'form-input--error' : ''}`}
                      value={form.number} onChange={handleFormChange} placeholder="12" />
                    {formErrors.number && <p className="form-error">⚠ {formErrors.number}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.route_type')} *</label>
                    <select name="type" className="form-select" value={form.type} onChange={handleFormChange}>
                      <option value="bus">🚌 Автобус</option>
                      <option value="trolleybus">⚡ Троллейбус</option>
                      <option value="tram">🚋 Трамвай</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Название (RU) *</label>
                    <input name="name_ru" className={`form-input ${formErrors.name_ru ? 'form-input--error' : ''}`}
                      value={form.name_ru} onChange={handleFormChange} placeholder="Маршрут №12" />
                    {formErrors.name_ru && <p className="form-error">⚠ {formErrors.name_ru}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Название (KZ)</label>
                    <input name="name_kz" className="form-input" value={form.name_kz} onChange={handleFormChange} placeholder="№12 бағыты" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Название (EN)</label>
                  <input name="name_en" className="form-input" value={form.name_en} onChange={handleFormChange} placeholder="Route №12" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('admin.from_stop')} (RU) *</label>
                    <input name="from_stop_ru" className={`form-input ${formErrors.from_stop_ru ? 'form-input--error' : ''}`}
                      value={form.from_stop_ru} onChange={handleFormChange} placeholder="Байтерек" />
                    {formErrors.from_stop_ru && <p className="form-error">⚠ {formErrors.from_stop_ru}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.to_stop')} (RU) *</label>
                    <input name="to_stop_ru" className={`form-input ${formErrors.to_stop_ru ? 'form-input--error' : ''}`}
                      value={form.to_stop_ru} onChange={handleFormChange} placeholder="ЖД Вокзал" />
                    {formErrors.to_stop_ru && <p className="form-error">⚠ {formErrors.to_stop_ru}</p>}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('admin.interval')} *</label>
                    <input name="interval_min" type="number" min="1" max="120" className={`form-input ${formErrors.interval_min ? 'form-input--error' : ''}`}
                      value={form.interval_min} onChange={handleFormChange} />
                    {formErrors.interval_min && <p className="form-error">⚠ {formErrors.interval_min}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.color')}</label>
                    <div className="color-pick-wrap">
                      <input name="color" type="color" className="color-pick-input" value={form.color} onChange={handleFormChange} />
                      <input name="color" type="text" className="form-input" value={form.color} onChange={handleFormChange} style={{ flex: 1 }} />
                    </div>
                  </div>
                </div>
                <div className="modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={closeForm}>{t('admin.cancel')}</button>
                  <button id="route-save-btn" type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? '⏳ ...' : `💾 ${t('admin.save')}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

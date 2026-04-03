import { useLanguage } from '../../context/LanguageContext';
import './ScheduleTable.css';

/**
 * Renders a grid of departure times for a route schedule.
 * @param {Array} schedules - Array of schedule objects with departure times
 */
export default function ScheduleTable({ schedules }) {
  const { t } = useLanguage();

  if (!schedules || schedules.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🕐</div>
        <h3>{t('route_detail.no_schedule')}</h3>
      </div>
    );
  }

  // Get current time to highlight next departure
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const nextDepartureIdx = schedules.findIndex(
    (s) => toMinutes(s.departure) > currentMinutes
  );

  return (
    <div className="schedule-table">
      <div className="schedule-table__header">
        <span>🕐 {t('route_detail.departures')} ({schedules.length})</span>
      </div>
      <div className="schedule-table__grid">
        {schedules.map((s, idx) => {
          const isPast = toMinutes(s.departure) < currentMinutes;
          const isNext = idx === nextDepartureIdx;
          return (
            <div
              key={s.id}
              className={`schedule-time ${isPast ? 'schedule-time--past' : ''} ${isNext ? 'schedule-time--next' : ''}`}
            >
              {s.departure}
              {isNext && <span className="schedule-time__next-label">▶</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const db = require('../database/db');

/** GET /api/schedules/:routeId - Get schedule for a route */
const getScheduleByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { days = 'weekday' } = req.query;

    const route = await db.query('SELECT id FROM routes WHERE id = $1', [routeId]);
    if (route.rows.length === 0) return res.status(404).json({ error: 'Route not found' });

    const { rows } = await db.query(`
      SELECT id, departure, direction, days
      FROM schedules
      WHERE route_id = $1 AND days = $2
      ORDER BY departure
    `, [routeId, days]);

    res.json(rows);
  } catch (err) {
    console.error('[getScheduleByRoute]', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

/** POST /api/schedules - Add departure (admin only) */
const createSchedule = async (req, res) => {
  try {
    const { route_id, departure, direction = 'forward', days = 'weekday' } = req.body;

    if (!route_id || !departure) {
      return res.status(400).json({ error: 'route_id and departure are required' });
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(departure)) {
      return res.status(400).json({ error: 'Departure must be in HH:MM format' });
    }

    const route = await db.query('SELECT id FROM routes WHERE id = $1', [route_id]);
    if (route.rows.length === 0) return res.status(404).json({ error: 'Route not found' });

    const duplicate = await db.query(
      'SELECT id FROM schedules WHERE route_id = $1 AND departure = $2 AND direction = $3 AND days = $4',
      [route_id, departure, direction, days]
    );
    if (duplicate.rows.length > 0) return res.status(409).json({ error: 'This departure time already exists' });

    const result = await db.query(
      'INSERT INTO schedules (route_id, departure, direction, days) VALUES ($1, $2, $3, $4) RETURNING id',
      [route_id, departure, direction, days]
    );

    const newSchedule = await db.query('SELECT * FROM schedules WHERE id = $1', [result.rows[0].id]);
    res.status(201).json({ message: 'Schedule added successfully', schedule: newSchedule.rows[0] });
  } catch (err) {
    console.error('[createSchedule]', err);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
};

/** PUT /api/schedules/:id - Update departure (admin only) */
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Schedule entry not found' });

    const { departure, direction, days } = req.body;
    if (departure) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(departure)) {
        return res.status(400).json({ error: 'Departure must be in HH:MM format' });
      }
    }

    await db.query(
      'UPDATE schedules SET departure = COALESCE($1, departure), direction = COALESCE($2, direction), days = COALESCE($3, days) WHERE id = $4',
      [departure || null, direction || null, days || null, id]
    );

    const updated = await db.query('SELECT * FROM schedules WHERE id = $1', [id]);
    res.json({ message: 'Schedule updated successfully', schedule: updated.rows[0] });
  } catch (err) {
    console.error('[updateSchedule]', err);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

/** DELETE /api/schedules/:id - Delete departure (admin only) */
const deleteSchedule = async (req, res) => {
  try {
    const existing = await db.query('SELECT id FROM schedules WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Schedule entry not found' });

    await db.query('DELETE FROM schedules WHERE id = $1', [req.params.id]);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    console.error('[deleteSchedule]', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

module.exports = { getScheduleByRoute, createSchedule, updateSchedule, deleteSchedule };

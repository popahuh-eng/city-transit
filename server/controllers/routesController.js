const db = require('../database/db');

/** GET /api/routes - Get all active routes */
const getAllRoutes = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, number, type, name_ru, name_kz, name_en,
             from_stop_ru, from_stop_kz, from_stop_en,
             to_stop_ru, to_stop_kz, to_stop_en,
             interval_min, is_active, color
      FROM routes WHERE is_active = 1
      ORDER BY length(number), number
    `);
    res.json(rows);
  } catch (err) {
    console.error('[getAllRoutes]', err);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

/** GET /api/routes/:id - Get route with stops */
const getRouteById = async (req, res) => {
  try {
    const routeResult = await db.query(`
      SELECT id, number, type, name_ru, name_kz, name_en,
             from_stop_ru, from_stop_kz, from_stop_en,
             to_stop_ru, to_stop_kz, to_stop_en,
             interval_min, is_active, color
      FROM routes WHERE id = $1
    `, [req.params.id]);

    const route = routeResult.rows[0];
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const stopsResult = await db.query(`
      SELECT id, name_ru, name_kz, name_en, order_num, lat, lng
      FROM stops WHERE route_id = $1
      ORDER BY order_num
    `, [req.params.id]);

    res.json({ ...route, stops: stopsResult.rows });
  } catch (err) {
    console.error('[getRouteById]', err);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};

/** POST /api/routes - Create route (admin only) */
const createRoute = async (req, res) => {
  try {
    const {
      number, type, name_ru, name_kz, name_en,
      from_stop_ru, from_stop_kz, from_stop_en,
      to_stop_ru, to_stop_kz, to_stop_en,
      interval_min, color, stops,
    } = req.body;

    if (!number || !type || !name_ru || !from_stop_ru || !to_stop_ru) {
      return res.status(400).json({ error: 'Required fields: number, type, names, from/to stops' });
    }
    if (!['bus', 'trolleybus', 'tram'].includes(type)) {
      return res.status(400).json({ error: 'Type must be: bus, trolleybus, or tram' });
    }

    const existing = await db.query('SELECT id FROM routes WHERE number = $1', [number]);
    if (existing.rows.length > 0) return res.status(409).json({ error: `Route №${number} already exists` });

    try {
      await db.query('BEGIN');
      const routeResult = await db.query(`
        INSERT INTO routes (number, type, name_ru, name_kz, name_en,
          from_stop_ru, from_stop_kz, from_stop_en,
          to_stop_ru, to_stop_kz, to_stop_en, interval_min, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        number, type,
        name_ru, name_kz || name_ru, name_en || name_ru,
        from_stop_ru, from_stop_kz || from_stop_ru, from_stop_en || from_stop_ru,
        to_stop_ru, to_stop_kz || to_stop_ru, to_stop_en || to_stop_ru,
        interval_min || 15, color || '#3b82f6'
      ]);

      const routeId = routeResult.rows[0].id;

      if (Array.isArray(stops) && stops.length > 0) {
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          await db.query(
            'INSERT INTO stops (route_id, name_ru, name_kz, name_en, order_num) VALUES ($1, $2, $3, $4, $5)',
            [routeId, stop.name_ru, stop.name_kz || stop.name_ru, stop.name_en || stop.name_ru, i + 1]
          );
        }
      }

      await db.query('COMMIT');
      
      const newRoute = await db.query('SELECT * FROM routes WHERE id = $1', [routeId]);
      res.status(201).json({ message: 'Route created successfully', route: newRoute.rows[0] });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('[createRoute]', err);
    res.status(500).json({ error: 'Failed to create route' });
  }
};

/** PUT /api/routes/:id - Update route (admin only) */
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await db.query('SELECT id FROM routes WHERE id = $1', [id]);
    if (route.rows.length === 0) return res.status(404).json({ error: 'Route not found' });

    const fields = [
      'number', 'type', 'name_ru', 'name_kz', 'name_en',
      'from_stop_ru', 'from_stop_kz', 'from_stop_en',
      'to_stop_ru', 'to_stop_kz', 'to_stop_en',
      'interval_min', 'is_active', 'color',
    ];

    const updates = [];
    const values = [];
    let queryIndex = 1;
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${queryIndex}`);
        values.push(req.body[field]);
        queryIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await db.query(`UPDATE routes SET ${updates.join(', ')} WHERE id = $${queryIndex}`, values);
    
    const updated = await db.query('SELECT * FROM routes WHERE id = $1', [id]);
    res.json({ message: 'Route updated successfully', route: updated.rows[0] });
  } catch (err) {
    console.error('[updateRoute]', err);
    res.status(500).json({ error: 'Failed to update route' });
  }
};

/** DELETE /api/routes/:id - Delete route (admin only) */
const deleteRoute = async (req, res) => {
  try {
    const route = await db.query('SELECT id, number FROM routes WHERE id = $1', [req.params.id]);
    if (route.rows.length === 0) return res.status(404).json({ error: 'Route not found' });

    await db.query('DELETE FROM routes WHERE id = $1', [req.params.id]);
    res.json({ message: `Route №${route.rows[0].number} deleted successfully` });
  } catch (err) {
    console.error('[deleteRoute]', err);
    res.status(500).json({ error: 'Failed to delete route' });
  }
};

/** GET /api/routes/between?from=stop&to=stop */
const getBetween = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to stop names are required' });
    const like = (s) => `%${s}%`;
    const searchFrom = like(from);
    const searchTo = like(to);
    
    const { rows } = await db.query(`
      SELECT DISTINCT r.id, r.number, r.type, r.name_ru, r.name_kz, r.name_en,
             r.from_stop_ru, r.from_stop_kz, r.from_stop_en,
             r.to_stop_ru, r.to_stop_kz, r.to_stop_en,
             r.interval_min, r.color,
             s1.name_ru AS from_stop_matched, s1.order_num AS from_order,
             s2.name_ru AS to_stop_matched,   s2.order_num AS to_order
      FROM routes r
      JOIN stops s1 ON s1.route_id = r.id
      JOIN stops s2 ON s2.route_id = r.id
      WHERE (s1.name_ru ILIKE $1 OR s1.name_kz ILIKE $2 OR s1.name_en ILIKE $3)
        AND (s2.name_ru ILIKE $4 OR s2.name_kz ILIKE $5 OR s2.name_en ILIKE $6)
        AND s1.order_num < s2.order_num
        AND r.is_active = 1
    `, [searchFrom, searchFrom, searchFrom, searchTo, searchTo, searchTo]);
    
    res.json(rows);
  } catch (err) {
    console.error('[getBetween]', err);
    res.status(500).json({ error: 'Failed to find routes' });
  }
};

module.exports = { getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute, getBetween };

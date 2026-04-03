const db = require('../database/db');

/** GET /api/search?q=query - Search routes and stops */
const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = `%${q.trim()}%`;

    const routesResult = await db.query(`
      SELECT DISTINCT r.id, r.number, r.type, r.name_ru, r.name_kz, r.name_en,
             r.from_stop_ru, r.from_stop_kz, r.from_stop_en,
             r.to_stop_ru, r.to_stop_kz, r.to_stop_en,
             r.interval_min, r.color
      FROM routes r
      LEFT JOIN stops s ON s.route_id = r.id
      WHERE r.is_active = 1 AND (
        r.number ILIKE $1
        OR r.name_ru ILIKE $2 OR r.name_kz ILIKE $3 OR r.name_en ILIKE $4
        OR r.from_stop_ru ILIKE $5 OR r.from_stop_kz ILIKE $6 OR r.from_stop_en ILIKE $7
        OR r.to_stop_ru ILIKE $8 OR r.to_stop_kz ILIKE $9 OR r.to_stop_en ILIKE $10
        OR s.name_ru ILIKE $11 OR s.name_kz ILIKE $12 OR s.name_en ILIKE $13
      )
      ORDER BY r.number
      LIMIT 20
    `, Array(13).fill(query));

    const stopsResult = await db.query(`
      SELECT s.id, s.name_ru, s.name_kz, s.name_en, s.order_num,
             r.id as route_id, r.number as route_number, r.type as route_type, r.color
      FROM stops s
      JOIN routes r ON r.id = s.route_id
      WHERE r.is_active = 1 AND (
        s.name_ru ILIKE $1 OR s.name_kz ILIKE $2 OR s.name_en ILIKE $3
      )
      ORDER BY s.name_ru
      LIMIT 15
    `, Array(3).fill(query));

    res.json({ routes: routesResult.rows, stops: stopsResult.rows, total: routesResult.rows.length + stopsResult.rows.length });
  } catch (err) {
    console.error('[search]', err);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
};

module.exports = { search };

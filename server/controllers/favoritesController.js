const db = require('../database/db');

const getFavorites = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.* FROM routes r
      JOIN favorites f ON r.id = f.route_id
      WHERE f.user_id = $1 AND r.is_active = 1
      ORDER BY f.id DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('[getFavorites]', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

const addFavorite = async (req, res) => {
  try {
    await db.query(`
      INSERT INTO favorites (user_id, route_id) 
      VALUES ($1, $2)
      ON CONFLICT (user_id, route_id) DO NOTHING
    `, [req.user.id, req.params.routeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[addFavorite]', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    await db.query('DELETE FROM favorites WHERE user_id = $1 AND route_id = $2', [req.user.id, req.params.routeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[removeFavorite]', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id FROM favorites WHERE user_id = $1 AND route_id = $2', [req.user.id, req.params.routeId]);
    res.json({ isFavorite: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check favorite' });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };

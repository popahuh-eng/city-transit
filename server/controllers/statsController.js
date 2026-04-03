const db = require('../database/db');

const getStats = async (req, res) => {
  try {
    const routesRes = await db.query('SELECT COUNT(*) as c FROM routes WHERE is_active = 1');
    const stopsRes  = await db.query('SELECT COUNT(*) as c FROM stops');
    const depRes    = await db.query('SELECT COUNT(*) as c FROM schedules WHERE direction = $1', ['forward']);
    
    res.json({
      routes: parseInt(routesRes.rows[0].c),
      stops: parseInt(stopsRes.rows[0].c),
      departures: parseInt(depRes.rows[0].c),
      districts: 9
    });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = { getStats };

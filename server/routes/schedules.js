const express = require('express');
const router = express.Router();
const { getScheduleByRoute, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/schedulesController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/:routeId', getScheduleByRoute);
router.post('/', authenticate, requireAdmin, createSchedule);
router.put('/:id', authenticate, requireAdmin, updateSchedule);
router.delete('/:id', authenticate, requireAdmin, deleteSchedule);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute, getBetween } = require('../controllers/routesController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/',        getAllRoutes);
router.get('/between', getBetween);   // must be before /:id
router.get('/:id',     getRouteById);
router.post('/',       authenticate, requireAdmin, createRoute);
router.put('/:id',     authenticate, requireAdmin, updateRoute);
router.delete('/:id',  authenticate, requireAdmin, deleteRoute);

module.exports = router;


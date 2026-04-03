const express = require('express');
const router  = express.Router();
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favoritesController');
const { authenticate } = require('../middleware/auth');

router.get('/',            authenticate, getFavorites);
router.get('/:routeId',   authenticate, checkFavorite);
router.post('/:routeId',  authenticate, addFavorite);
router.delete('/:routeId',authenticate, removeFavorite);

module.exports = router;

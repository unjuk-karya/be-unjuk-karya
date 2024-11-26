const express = require('express');
const router = express.Router({ mergeParams: true });
const favoriteController = require('../controllers/favorite.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, favoriteController.toggleFavorite);

module.exports = router;
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, categoryController.getAllCategories);

module.exports = router;
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const createUpload = require('../middlewares/upload.middleware');

router.post('/', authMiddleware, ...createUpload('image', 'products/'), productController.createProduct);
router.put('/:id', authMiddleware, ...createUpload('image', 'products/'), productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.get('/', authMiddleware, productController.getAllProducts);
router.get('/:id', authMiddleware, productController.getProductById);

module.exports = router;

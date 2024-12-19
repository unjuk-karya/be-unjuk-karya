const productService = require('../services/product.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');
const bucket = require('../../../config/gcs');

const productController = {
  createProduct: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, description, price, stock, categoryId } = req.body;
      const image = req.file?.cloudStoragePublicUrl;

      const result = await productService.createProduct({
        userId,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId: parseInt(categoryId),
        image,
      });

      return res.status(201).json(
        createSuccessResponse(result, 'Product created successfully', 201)
      );
    } catch (error) {
      if (req.file?.cloudStoragePublicUrl) {
        try {
          const imagePath = new URL(req.file.cloudStoragePublicUrl).pathname.split('/').slice(2).join('/');
          await bucket.file(imagePath).delete();
        } catch (err) {
        }
      }
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  updateProduct: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, description, price, stock, categoryId } = req.body;
      const image = req.file?.cloudStoragePublicUrl;

      const result = await productService.updateProduct({
        id,
        userId,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId: parseInt(categoryId),
        image
      });

      return res.json(
        createSuccessResponse(result, "Product updated successfully")
      );
    } catch (error) {
      if (req.file?.cloudStoragePublicUrl) {
        try {
          const imagePath = new URL(req.file.cloudStoragePublicUrl).pathname.split('/').slice(2).join('/');
          await bucket.file(imagePath).delete();
        } catch (err) {
        }
      }
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await productService.deleteProduct({ id, userId });
      return res.json(createSuccessResponse(null, "Product deleted successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await productService.getProductById(id, userId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getAllProducts: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search || '';

      const result = await productService.getAllProducts(page, pageSize, userId, search);

      return res.json(createSuccessResponse(result, "Products fetched successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getProductReviews: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await productService.getProductReviews(id, page, pageSize);
      return res.json(createSuccessResponse(result, "Product reviews fetched successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = productController;
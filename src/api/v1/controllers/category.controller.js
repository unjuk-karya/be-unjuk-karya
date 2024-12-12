const categoryService = require('../services/category.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const categoryController = {
  getAllCategories: async (req, res) => {
    try {
      const result = await categoryService.getAllCategories();
      return res.json(createSuccessResponse(result, "Categories fetched successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = categoryController;
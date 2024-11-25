const authService = require('../services/auth.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const authController = {
  register: async (req, res) => {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(createSuccessResponse(result, "Registration successful", 201));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  login: async (req, res) => {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(createSuccessResponse(result, "Login successful", 200));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = authController;
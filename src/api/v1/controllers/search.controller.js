const userService = require('../services/search.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const searchController = {
  searchUsers: async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 1) {
        return res.json(createSuccessResponse([]));
      }

      const users = await userService.searchUsers(q);
      return res.json(createSuccessResponse(users, "Users retrieved successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = searchController;
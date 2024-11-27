const followService = require('../services/follow.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const followController = {
  toggleFollow: async (req, res) => {
    try {
      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      const result = await followService.toggleFollow({
        followerId,
        followingId
      });

      return res.json(createSuccessResponse(result,
        result.following ? "User followed successfully" : "User unfollowed successfully"
      ));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getFollowers: async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await followService.getFollowers(userId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getFollowing: async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await followService.getFollowing(userId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = followController;
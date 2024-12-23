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
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      const result = await followService.getFollowers(userId, currentUserId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getFollowings: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      const result = await followService.getFollowings(userId, currentUserId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = followController;
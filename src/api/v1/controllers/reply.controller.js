const replyService = require('../services/reply.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const replyController = {
  createReply: async (req, res) => {
    try {
      const userId = req.user.id;
      const { postId, commentId } = req.params;
      const { content } = req.body;

      const result = await replyService.createReply({
        userId,
        postId,
        commentId,
        content
      });

      return res.status(201).json(
        createSuccessResponse(result, "Reply created successfully", 201)
      );
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  deleteReply: async (req, res) => {
    try {
      const userId = req.user.id;
      const { postId, commentId, id } = req.params;

      await replyService.deleteReply({
        id,
        userId,
        postId,
        commentId
      });

      return res.json(
        createSuccessResponse(null, "Reply deleted successfully")
      );
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getReplies: async (req, res) => {
    try {
      const { postId, commentId } = req.params;

      const result = await replyService.getReplies({
        postId,
        commentId
      });

      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = replyController;
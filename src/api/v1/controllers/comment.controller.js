const commentService = require('../services/comment.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const commentController = {
  createComment: async (req, res) => {
    try {
      const userId = req.user.id;
      const { postId } = req.params;
      const { content } = req.body;

      const result = await commentService.createComment({
        userId,
        postId,
        content
      });

      return res.status(201).json(
        createSuccessResponse(result, "Comment created successfully", 201)
      );
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  deleteComment: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id, postId } = req.params;

      await commentService.deleteComment({ id, userId, postId });
      return res.json(
        createSuccessResponse(null, "Comment deleted successfully")
      );
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getPostComments: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id; 
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 5;
  
      const result = await commentService.getPostComments(postId, userId, page, pageSize);
      return res.json(createSuccessResponse(result, "Comments retrieved successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
  
};

module.exports = commentController;
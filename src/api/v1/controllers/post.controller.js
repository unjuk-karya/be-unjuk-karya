const postService = require('../services/post.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');
const fs = require('fs').promises;

const postController = {
  createPost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, content } = req.body;
      const image = req.file?.path;

      try {
        const result = await postService.createPost({
          userId,
          title,
          content,
          image
        });

        return res.status(201).json(
          createSuccessResponse(result, "Post created successfully", 201)
        );
      } catch (error) {
        if (image) {
          await fs.unlink(image)
            .catch(err => console.error('Error deleting file:', err));
        }
        throw error;
      }
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },
  updatePost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, content } = req.body;
      const image = req.file?.path;

      try {
        const result = await postService.updatePost({
          id,
          userId,
          title,
          content,
          image
        });

        return res.json(
          createSuccessResponse(result, "Post updated successfully")
        );
      } catch (error) {
        if (image) {
          await fs.unlink(image)
            .catch(err => console.error('Error deleting file:', err));
        }
        throw error;
      }
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },
  deletePost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await postService.deletePost({ id, userId });
      return res.json(createSuccessResponse(null, "Post deleted successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await postService.getPostById(id, userId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = postController;
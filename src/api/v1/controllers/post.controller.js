const postService = require('../services/post.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');
const bucket = require('../../../config/gcs');

const postController = {
  createPost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, content } = req.body;
      const image = req.file?.cloudStoragePublicUrl;

      const result = await postService.createPost({
        userId,
        title,
        content,
        image,
      });

      return res.status(201).json(
        createSuccessResponse(result, 'Post created successfully', 201)
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

  updatePost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, content } = req.body;
      const image = req.file?.cloudStoragePublicUrl;

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
  },

  getAllPosts: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
  
      const result = await postService.getAllPosts(userId, page, pageSize);
  
      return res.json(createSuccessResponse(result, "Posts fetched successfully"));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getFollowingPosts: async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const result = await postService.getFollowingPosts(userId, page, pageSize);

        return res.json(createSuccessResponse(result, "Following posts fetched successfully"));
    } catch (error) {
        return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = postController;
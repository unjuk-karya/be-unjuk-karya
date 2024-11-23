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
  }
};

module.exports = postController;
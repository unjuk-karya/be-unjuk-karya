const likeService = require('../services/like.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const likeController = {
    toggleLike: async (req, res) => {
        try {
            const userId = req.user.id;
            const { postId } = req.params;

            const result = await likeService.toggleLike({ postId, userId });
            return res.json(createSuccessResponse(result,
                result.liked ? "Post liked successfully" : "Post unliked successfully"
            ));
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    },

    getPostLikes: async (req, res) => {
        try {
            const { postId } = req.params;
            const result = await likeService.getPostLikes(postId);
            return res.json(createSuccessResponse(result));
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    }
};

module.exports = likeController;
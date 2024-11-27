const commentLikeService = require('../services/comment-like.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const commentLikeController = {
    toggleLike: async (req, res) => {
        try {
            const userId = req.user.id;
            const { postId, commentId } = req.params;
            const result = await commentLikeService.toggleLike({ postId, commentId, userId });
            
            return res.json(createSuccessResponse(result,
                result.liked ? "Comment liked successfully" : "Comment unliked successfully"
            ));
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    }
};

module.exports = commentLikeController;
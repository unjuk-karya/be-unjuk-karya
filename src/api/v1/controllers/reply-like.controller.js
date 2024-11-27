const replyLikeService = require('../services/reply-like.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const replyLikeController = {
    toggleLike: async (req, res) => {
        try {
            const userId = req.user.id;
            const { postId, commentId, replyId } = req.params;

            const result = await replyLikeService.toggleLike({
                userId,
                postId,
                commentId,
                replyId
            });

            return res.json(createSuccessResponse(result,
                result.liked ? "Reply liked successfully" : "Reply unliked successfully"
            ));
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    }
};

module.exports = replyLikeController;
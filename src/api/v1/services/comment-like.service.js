const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const commentLikeService = {
    toggleLike: async (data) => {
        const { postId, commentId, userId } = data;

        const comment = await prisma.comment.findFirst({
            where: {
                id: parseInt(commentId),
                postId: parseInt(postId)
            }
        });

        if (!comment) {
            throw new NotFoundError("Comment");
        }

        const existingLike = await prisma.commentLike.findFirst({
            where: {
                commentId: parseInt(commentId),
                userId: parseInt(userId)
            }
        });

        if (existingLike) {
            await prisma.commentLike.delete({
                where: { id: existingLike.id }
            });
            return { liked: false };
        }

        await prisma.commentLike.create({
            data: {
                commentId: parseInt(commentId),
                userId: parseInt(userId)
            }
        });

        return { liked: true };
    }
};

module.exports = commentLikeService;
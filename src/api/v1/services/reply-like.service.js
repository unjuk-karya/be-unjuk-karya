const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const replyLikeService = {
    toggleLike: async (data) => {
        const { userId, postId, commentId, replyId } = data;

        const reply = await prisma.commentReply.findFirst({
            where: {
                id: parseInt(replyId),
                commentId: parseInt(commentId),
                comment: {
                    postId: parseInt(postId)
                }
            }
        });

        if (!reply) {
            throw new NotFoundError("Reply");
        }

        const existingLike = await prisma.commentReplyLike.findFirst({
            where: {
                replyId: parseInt(replyId),
                userId: parseInt(userId)
            }
        });

        if (existingLike) {
            await prisma.commentReplyLike.delete({
                where: { id: existingLike.id }
            });
            return { liked: false };
        }

        await prisma.commentReplyLike.create({
            data: {
                userId: parseInt(userId),
                replyId: parseInt(replyId)
            }
        });

        return { liked: true };
    }
};

module.exports = replyLikeService;
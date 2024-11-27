const { handleValidation, NotFoundError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const replyService = {
    createReply: async (data) => {
        const { userId, commentId, postId, content } = data;

        handleValidation({
            content: { value: content, message: "The reply content is required." }
        });

        const comment = await prisma.comment.findFirst({
            where: {
                id: parseInt(commentId),
                postId: parseInt(postId)
            }
        });

        if (!comment) {
            throw new NotFoundError("Comment");
        }

        try {
            return await prisma.commentReply.create({
                data: {
                    content,
                    userId: parseInt(userId),
                    commentId: parseInt(commentId)
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            });
        } catch (error) {
            throw new Error("Failed to create reply");
        }
    },

    deleteReply: async (data) => {
        const { id, userId, commentId, postId } = data;

        const comment = await prisma.comment.findFirst({
            where: {
                id: parseInt(commentId),
                postId: parseInt(postId)
            }
        });

        if (!comment) {
            throw new NotFoundError("Comment");
        }

        const reply = await prisma.commentReply.findFirst({
            where: {
                id: parseInt(id),
                commentId: parseInt(commentId)
            }
        });

        if (!reply) {
            throw new NotFoundError("Reply");
        }

        if (reply.userId !== parseInt(userId)) {
            throw new UnauthorizedError("You are not authorized to delete this reply");
        }

        try {
            await prisma.$transaction([
                prisma.commentReplyLike.deleteMany({ where: { replyId: parseInt(id) } }),
                prisma.commentReply.delete({ where: { id: parseInt(id) } })
            ]);
            return true;
        } catch (error) {
            throw new Error("Failed to delete reply");
        }
    },

    getReplies: async (data) => {
        const { commentId, postId, userId } = data;

        const comment = await prisma.comment.findFirst({
            where: {
                id: parseInt(commentId),
                postId: parseInt(postId)
            }
        });

        if (!comment) {
            throw new NotFoundError("Comment");
        }

        const replies = await prisma.commentReply.findMany({
            where: { commentId: parseInt(commentId) },
            select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                likes: userId ? {
                    where: {
                        userId: parseInt(userId)
                    },
                    take: 1
                } : false,
                _count: {
                    select: {
                        likes: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return replies.map(reply => ({
            ...reply,
            likesCount: reply._count.likes,
            isLiked: userId ? reply.likes.length > 0 : false,
            _count: undefined,
            likes: undefined
        }));
    }
};

module.exports = replyService;
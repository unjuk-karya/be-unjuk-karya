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
      await prisma.commentReply.delete({
        where: { id: parseInt(id) }
      });
      return true;
    } catch (error) {
      throw new Error("Failed to delete reply");
    }
  },

  getReplies: async (data) => {
    const { commentId, postId } = data;

    const comment = await prisma.comment.findFirst({
      where: { 
        id: parseInt(commentId),
        postId: parseInt(postId)
      }
    });

    if (!comment) {
      throw new NotFoundError("Comment");
    }

    return await prisma.commentReply.findMany({
      where: { commentId: parseInt(commentId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
};

module.exports = replyService;
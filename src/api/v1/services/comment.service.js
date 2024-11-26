const { handleValidation, NotFoundError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const commentService = {
  createComment: async (data) => {
    const { userId, postId, content } = data;

    handleValidation({
      content: { value: content, message: "The comment content is required." }
    });

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      throw new NotFoundError("Post");
    }

    try {
      return await prisma.comment.create({
        data: {
          content,
          userId: parseInt(userId),
          postId: parseInt(postId)
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
      throw new Error("Failed to create comment");
    }
  },

  updateComment: async (data) => {
    const { id, userId, content } = data;

    handleValidation({
      content: { value: content, message: "The comment content is required." }
    });

    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingComment) {
      throw new NotFoundError("Comment");
    }

    if (existingComment.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to update this comment");
    }

    try {
      return await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { content },
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
      throw new Error("Failed to update comment");
    }
  },

  deleteComment: async (data) => {
    const { id, userId } = data;

    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingComment) {
      throw new NotFoundError("Comment");
    }

    if (existingComment.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to delete this comment");
    }

    try {
      await prisma.comment.delete({
        where: { id: parseInt(id) }
      });
      return true;
    } catch (error) {
      throw new Error("Failed to delete comment");
    }
  },

  getPostComments: async (postId) => {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      throw new NotFoundError("Post");
    }

    return await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
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

module.exports = commentService;
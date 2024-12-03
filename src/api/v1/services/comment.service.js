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

  deleteComment: async (data) => {
    const { id, userId, postId } = data;

    const existingComment = await prisma.comment.findFirst({
      where: {
        id: parseInt(id),
        postId: parseInt(postId)
      }
    });

    if (!existingComment) {
      throw new NotFoundError("Comment");
    }

    if (existingComment.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to delete this comment");
    }

    try {
      await prisma.$transaction([
        prisma.commentReplyLike.deleteMany({ where: { reply: { commentId: parseInt(id) } } }),
        prisma.commentReply.deleteMany({ where: { commentId: parseInt(id) } }),
        prisma.commentLike.deleteMany({ where: { commentId: parseInt(id) } }),
        prisma.comment.delete({ where: { id: parseInt(id) } })
      ]);
      return true;
    } catch (error) {
      throw new Error("Failed to delete comment");
    }
  },

  getPostComments: async (postId, userId, page = 1, pageSize = 5) => {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });
  
    if (!post) {
      throw new NotFoundError("Post");
    }
  
    const skip = (page - 1) * pageSize;
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
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
            likes: true,
            replies: true
          }
        }
      },
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      }
    });
  
    const totalComments = await prisma.comment.count({
      where: { postId: parseInt(postId) }
    });
  
    return {
      comments: comments.map(comment => ({
        ...comment,
        likesCount: comment._count.likes,
        repliesCount: comment._count.replies,
        isLiked: userId ? comment.likes.length > 0 : false,
        _count: undefined,
        likes: undefined
      })),
      pagination: {
        currentPage: page,
        pageSize,
        totalComments,
        totalPages: Math.ceil(totalComments / pageSize)
      }
    };
  }
  
};
module.exports = commentService;
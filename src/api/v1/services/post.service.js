const { handleValidation, NotFoundError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const fs = require('fs').promises;

const postService = {
  createPost: async (data) => {
    const { userId, title, content, image } = data;

    handleValidation({
      title: { value: title, message: "The title field is required." },
      content: { value: content, message: "The content field is required." },
      image: { value: image, message: "The image field is required." }
    });

    try {
      return await prisma.post.create({
        data: {
          title,
          content,
          image,
          userId: parseInt(userId)
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
      throw new Error("Failed to create post");
    }
  },

  updatePost: async (data) => {
    const { id, userId, title, content, image } = data;

    handleValidation({
      title: { value: title, message: "The title field is required." },
      content: { value: content, message: "The content field is required." }
    });

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      throw new NotFoundError("Post");
    }

    if (existingPost.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to update this post");
    }

    try {
      if (image && existingPost.image) {
        await fs.unlink(existingPost.image)
          .catch(err => console.error('Error deleting old image:', err));
      }

      return await prisma.post.update({
        where: { id: parseInt(id) },
        data: {
          title,
          content,
          image: image || existingPost.image
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
      if (image) {
        await fs.unlink(image)
          .catch(err => console.error('Error deleting new image:', err));
      }
      throw new Error("Failed to update post");
    }
  },

  deletePost: async (data) => {
    const { id, userId } = data;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      throw new NotFoundError("Post");
    }

    if (existingPost.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to delete this post");
    }

    try {
      await prisma.$transaction([
        prisma.commentReply.deleteMany({ where: { commentId: parseInt(id) } }), 
        prisma.commentLike.deleteMany({ where: { comment: { postId: parseInt(id) } } }),
        prisma.comment.deleteMany({ where: { postId: parseInt(id) } }),
        prisma.postLike.deleteMany({ where: { postId: parseInt(id) } }), 
        prisma.favorite.deleteMany({ where: { postId: parseInt(id) } }),
        prisma.post.delete({ where: { id: parseInt(id) } })
      ]);
      
      if (existingPost.image) {
        await fs.unlink(existingPost.image)
          .catch(err => console.error('Error deleting image:', err));
      }

      return true;
    } catch (error) {
      throw new Error("Failed to delete post");
    }
  },

  getPostById: async (id, userId) => {
    try {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          likes: {
            where: {
              userId: parseInt(userId)
            }
          },
          favorites: {
            where: {
              userId: parseInt(userId)
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });

      if (!post) {
        throw new NotFoundError("Post");
      }

      const { likes, favorites, _count, ...postData } = post;

      return {
        ...postData,
        isLiked: likes.length > 0,
        isFavorite: favorites.length > 0,
        likesCount: _count.likes,
        commentsCount: _count.comments
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Failed to get post");
    }
  },
};

module.exports = postService;
const { handleValidation, NotFoundError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bucket = require('../../../config/gcs');

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
        const oldImageName = existingPost.image.split('/').pop();
        try {
          await bucket.file(`posts/${oldImageName}`).delete();
        } catch (err) {
          throw new Error("Failed to delete old image");
        }
      }

      const updatedPost = await prisma.post.update({
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

      return updatedPost;

    } catch (error) {
      if (image) {
        const newImageName = image.split('/').pop();
        try {
          await bucket.file(`posts/${newImageName}`).delete();
        } catch (deleteErr) {
          throw new Error("Failed to delete new image after update error");
        }
      }
      throw error;
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
      if (existingPost.image) {
        const imageName = existingPost.image.split('/').pop();
        try {
          await bucket.file(`posts/${imageName}`).delete();
        } catch (err) {
          throw new Error("Failed to delete image");
        }
      }

      await prisma.$transaction([
        prisma.commentReplyLike.deleteMany({ where: { reply: { comment: { postId: parseInt(id) } } } }),
        prisma.commentReply.deleteMany({ where: { comment: { postId: parseInt(id) } } }),
        prisma.commentLike.deleteMany({ where: { comment: { postId: parseInt(id) } } }),
        prisma.comment.deleteMany({ where: { postId: parseInt(id) } }),
        prisma.postLike.deleteMany({ where: { postId: parseInt(id) } }),
        prisma.favorite.deleteMany({ where: { postId: parseInt(id) } }),
        prisma.post.delete({ where: { id: parseInt(id) } })
      ]);

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

      const followStatus = await prisma.follow.findFirst({
        where: {
          AND: [
            { followerId: parseInt(userId) },
            { followingId: post.user.id }
          ]
        }
      });

      const { likes, favorites, _count, ...postData } = post;

      return {
        ...postData,
        isFollowing: followStatus ? true : false,
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
  
  getAllPosts: async (userId) => {
    try {
      const posts = await prisma.post.findMany({
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
              likes: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const postsWithFollow = await Promise.all(
        posts.map(async (post) => {
          const followStatus = await prisma.follow.findFirst({
            where: {
              AND: [
                { followerId: parseInt(userId) },
                { followingId: post.user.id }
              ]
            }
          });

          const { likes, favorites, _count, ...postData } = post;
          return {
            ...postData,
            isFollowing: followStatus ? true : false,
            isLiked: likes.length > 0,
            isFavorite: favorites.length > 0,
            likesCount: _count.likes,
            commentsCount: _count.comments
          };
        })
      );

      return postsWithFollow;
    } catch (error) {
      throw new Error("Failed to get all posts");
    }
  },

  getFollowingPosts: async (userId) => {
    try {
      const posts = await prisma.post.findMany({
        where: {
          user: {
            following: {
              some: {
                followerId: parseInt(userId),
              },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          likes: {
            where: {
              userId: parseInt(userId),
            },
          },
          favorites: {
            where: {
              userId: parseInt(userId),
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const followStatus = await prisma.follow.findFirst({
            where: {
              followerId: parseInt(userId),
              followingId: post.user.id,
            },
          });

          const { likes, favorites, _count, ...postData } = post;
          return {
            ...postData,
            isFollowing: !!followStatus,
            isLiked: likes.length > 0,
            isFavorite: favorites.length > 0,
            likesCount: _count.likes,
            commentsCount: _count.comments,
          };
        })
      );

      return postsWithDetails;
    } catch (error) {
      throw new Error("Failed to get following posts");
    }
  }
}

module.exports = postService;
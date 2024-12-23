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
        prisma.commentLike.deleteMany({ where: { comment: { postId: parseInt(id) } } }),
        prisma.comment.deleteMany({ where: { postId: parseInt(id) } }),
        prisma.postLike.deleteMany({ where: { postId: parseInt(id) } }),
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

      const isMyself = post.user.id === parseInt(userId);
      const followStatus = !isMyself ? await prisma.follow.findFirst({
        where: {
          AND: [
            { followerId: parseInt(userId) },
            { followingId: post.user.id }
          ]
        }
      }) : null;

      const { likes, _count, ...postData } = post;

      return {
        ...postData,
        isMyself,
        isFollowing: !!followStatus,
        isLiked: likes.length > 0,
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

  getAllPosts: async (userId, page = 1, pageSize = 10, search = '') => {
    try {
      const skip = (page - 1) * pageSize;
  
      const where = {
        ...(search && {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } }
          ]
        })
      };
  
      const posts = await prisma.post.findMany({
        where,
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
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      });
  
      const totalPosts = await prisma.post.count({ where });
  
      const postsWithFollow = await Promise.all(
        posts.map(async (post) => {
          const { likes, _count, ...postData } = post;
          return {
            ...postData,
            likesCount: _count.likes,
            commentsCount: _count.comments,
            isLiked: likes.length > 0
          };
        })
      );
  
      return {
        posts: postsWithFollow,
        pagination: {
          currentPage: page,
          pageSize,
          totalPosts,
          totalPages: Math.ceil(totalPosts / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get all posts");
    }
  },

  getFollowingPosts: async (userId, page = 1, pageSize = 10) => {
    try {
      const skip = (page - 1) * pageSize;

      const posts = await prisma.post.findMany({
        where: {
          user: {
            followers: {
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
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      });

      const totalFollowingPosts = await prisma.post.count({
        where: {
          user: {
            followers: {
              some: {
                followerId: parseInt(userId),
              },
            },
          },
        },
      });

      const postsWithDetails = posts.map((post) => {
        const { likes, _count, ...postData } = post;

        return {
          ...postData,
          isLiked: likes.length > 0,
          likesCount: _count.likes,
          commentsCount: _count.comments,
        };
      });

      return {
        posts: postsWithDetails,
        pagination: {
          currentPage: page,
          pageSize,
          totalFollowingPosts,
          totalPages: Math.ceil(totalFollowingPosts / pageSize),
        },
      };
    } catch (error) {
      throw new Error("Failed to get following posts");
    }
  }
}

module.exports = postService;
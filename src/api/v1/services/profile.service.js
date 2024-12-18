const { NotFoundError, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bucket = require('../../../config/gcs');

const profileService = {
  updateProfile: async (data) => {
    const { id, email, username, name, phone, address, bio, avatar, coverPhoto, midtransServerKey, midtransClientKey, midtransIsProduction } = data;
  
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
  
    if (!existingUser) {
      throw new NotFoundError("User");
    }
  
    const errors = {};
  
    if (email !== undefined && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        errors.email = ["The email has already been taken."];
      }
    }
  
    if (username !== undefined && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({ where: { username } });
      if (usernameExists) {
        errors.username = ["The username has already been taken."];
      }
    }
  
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
  
    try {
      const updateData = {};
  
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (username !== undefined) updateData.username = username;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (bio !== undefined) updateData.bio = bio;
      if (midtransServerKey !== undefined) updateData.midtransServerKey = midtransServerKey;
      if (midtransClientKey !== undefined) updateData.midtransClientKey = midtransClientKey;
      if (midtransIsProduction !== undefined) updateData.midtransIsProduction = midtransIsProduction;
  
      if (avatar) {
        updateData.avatar = avatar;
        if (existingUser.avatar) {
          const oldAvatarName = existingUser.avatar.split('/').pop();
          try {
            await bucket.file(`avatars/${oldAvatarName}`).delete();
          } catch (err) {
            throw new Error("Failed to delete old avatar");
          }
        }
      }
  
      if (coverPhoto) {
        updateData.coverPhoto = coverPhoto;
        if (existingUser.coverPhoto) {
          const oldCoverName = existingUser.coverPhoto.split('/').pop();
          try {
            await bucket.file(`covers/${oldCoverName}`).delete();
          } catch (err) {
            throw new Error("Failed to delete old cover photo");
          }
        }
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          address: true,
          bio: true,
          avatar: true,
          coverPhoto: true,
          midtransServerKey: true,
          midtransClientKey: true,
          midtransIsProduction: true,
          createdAt: true,
          updatedAt: true
        }
      });
  
      return updatedUser;
  
    } catch (error) {
      if (avatar) {
        const newAvatarName = avatar.split('/').pop();
        try {
          await bucket.file(`avatars/${newAvatarName}`).delete();
        } catch (deleteErr) { }
      }
      if (coverPhoto) {
        const newCoverName = coverPhoto.split('/').pop();
        try {
          await bucket.file(`covers/${newCoverName}`).delete();
        } catch (deleteErr) { }
      }
      throw error;
    }
  },

  getUserProfile: async (userId, currentUserId) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        address: true,
        avatar: true,
        coverPhoto: true,
        midtransServerKey: true,
        midtransClientKey: true,
        midtransIsProduction: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            following: true,
            followers: true,
            posts: true
          }
        }
      }
    });
  
    if (!user) {
      throw new NotFoundError("User");
    }
  
    const productsCount = await prisma.product.count({
      where: {
        userId: parseInt(userId),
        deletedAt: null
      }
    });
  
    let isFollowing = false;
    const isMyself = parseInt(userId) === parseInt(currentUserId);
  
    if (!isMyself) {
      const followStatus = await prisma.follow.findFirst({
        where: {
          followerId: parseInt(currentUserId),
          followingId: parseInt(userId)
        }
      });
      isFollowing = !!followStatus;
    }
  
    return {
      ...user,
      isMyself,
      isFollowing,
      followingCount: user._count.following,
      followersCount: user._count.followers,
      postsCount: user._count.posts,
      productsCount,
      _count: undefined
    }
  },

  getUserPosts: async (userId, currentUserId, page = 1, pageSize = 10) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    try {
      const skip = (page - 1) * pageSize;

      const posts = await prisma.post.findMany({
        where: {
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
          },
          likes: {
            where: {
              userId: parseInt(currentUserId)
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

      const totalPosts = await prisma.post.count({
        where: {
          userId: parseInt(userId)
        }
      });

      const postsWithDetails = posts.map(post => {
        const { likes, _count, ...postData } = post;

        return {
          ...postData,
          likesCount: _count.likes,
          commentsCount: _count.comments
        };
      });

      return {
        posts: postsWithDetails,
        pagination: {
          currentPage: page,
          pageSize,
          totalPosts,
          totalPages: Math.ceil(totalPosts / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get user posts");
    }
  },

  getUserLikedPosts: async (userId, currentUserId, page = 1, pageSize = 10) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    try {
      const skip = (page - 1) * pageSize;

      const posts = await prisma.post.findMany({
        where: {
          likes: {
            some: {
              userId: parseInt(userId)
            }
          }
        },
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
              userId: parseInt(currentUserId)
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

      const totalLikedPosts = await prisma.post.count({
        where: {
          likes: {
            some: {
              userId: parseInt(userId)
            }
          }
        }
      });

      const postsWithDetails = posts.map(post => {
        const { likes, _count, ...postData } = post;

        return {
          ...postData,
          likesCount: _count.likes,
          commentsCount: _count.comments
        };
      });

      return {
        posts: postsWithDetails,
        pagination: {
          currentPage: page,
          pageSize,
          totalLikedPosts,
          totalPages: Math.ceil(totalLikedPosts / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get liked posts");
    }
  },

  getUserProducts: async (userId, currentUserId, page = 1, pageSize = 10) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
  
    if (!user) {
      throw new NotFoundError("User");
    }
  
    try {
      const skip = (page - 1) * pageSize;
  
      const products = await prisma.product.findMany({
        where: {
          userId: parseInt(userId),
          deletedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          orders: {
            where: { status: 'PAID' },
            include: {
              reviews: {
                select: { rating: true }
              }
            }
          },
          saves: {
            where: { userId: parseInt(currentUserId) }
          },
          _count: {
            select: {
              orders: {
                where: { status: 'PAID' }
              }
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      });
  
      const totalProducts = await prisma.product.count({
        where: {
          userId: parseInt(userId),
          deletedAt: null
        }
      });
  
      const productsWithDetails = products.map(product => {
        const ratings = product.orders.flatMap(order => order.reviews.map(review => review.rating));
        const averageRating = ratings.length > 0 ? 
          ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length : 0;
  
        const { _count, orders, saves, ...productData } = product;
        return {
          ...productData,
          rating: Number(averageRating.toFixed(1)),
          sold: _count.orders,
          isSaved: saves.length > 0
        };
      });
  
      return {
        products: productsWithDetails,
        pagination: {
          currentPage: page,
          pageSize,
          totalProducts,
          totalPages: Math.ceil(totalProducts / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get user products");
    }
  },

  getUserSavedProducts: async (userId, currentUserId, page = 1, pageSize = 10) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
  
    if (!user) {
      throw new NotFoundError("User");
    }
  
    try {
      const skip = (page - 1) * pageSize;
  
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          saves: {
            some: {
              userId: parseInt(userId)
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          orders: {
            where: { status: 'PAID' },
            include: {
              reviews: {
                select: { rating: true }
              }
            }
          },
          saves: {
            where: { 
              userId: parseInt(currentUserId)  
            }
          },
          _count: {
            select: {
              orders: {
                where: { status: 'PAID' }
              }
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      });
  
      const totalSavedProducts = await prisma.product.count({
        where: {
          deletedAt: null,
          saves: {
            some: {
              userId: parseInt(userId)  
            }
          }
        }
      });
  
      const productsWithDetails = products.map(product => {
        const ratings = product.orders.flatMap(order => order.reviews.map(review => review.rating));
        const averageRating = ratings.length > 0 ? 
          ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length : 0;
  
        const { _count, orders, saves, ...productData } = product;
        return {
          ...productData,
          rating: Number(averageRating.toFixed(1)),
          sold: _count.orders,
          isSaved: saves.length > 0 
        };
      });
  
      return {
        products: productsWithDetails,
        pagination: {
          currentPage: page,
          pageSize,
          totalSavedProducts,
          totalPages: Math.ceil(totalSavedProducts / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get saved products");
    }
  }
};

module.exports = profileService;
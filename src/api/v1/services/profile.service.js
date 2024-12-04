const { NotFoundError, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bucket = require('../../../config/gcs');

const profileService = {
  updateProfile: async (data) => {
    const { id, email, username, name, phone, address, bio, avatar, coverPhoto } = data;

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
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            following: true,
            followers: true,
            posts: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError("User");
    }

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
                  saves: {
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
  
          const postsWithDetails = await Promise.all(
              posts.map(async (post) => {
                  const { likes, saves, _count, ...postData } = post;
  
                  return {
                      ...postData,
                      likesCount: _count.likes,
                      commentsCount: _count.comments
                  };
              })
          );
  
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
                  saves: {
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
              const { likes, saves, _count, ...postData } = post;
  
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

  getUserSavedPosts: async (userId, currentUserId) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new NotFoundError("User");
    }
    try {
      const posts = await prisma.post.findMany({
        where: {
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
          likes: {
            where: {
              userId: parseInt(currentUserId)
            }
          },
          saves: {
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
        orderBy: {
          createdAt: 'desc'
        }
      });

      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const { likes, saves, _count, ...postData } = post;
          const isMyself = post.user.id === parseInt(currentUserId);

          const followStatus = !isMyself ? await prisma.follow.findFirst({
            where: {
              AND: [
                { followerId: parseInt(currentUserId) },
                { followingId: post.user.id }
              ]
            }
          }) : null;

          return {
            ...postData,
            isMyself,
            isFollowing: !!followStatus,
            isLiked: likes.length > 0,
            isSaved: saves.length > 0,
            likesCount: _count.likes,
            commentsCount: _count.comments
          };
        })
      );

      return postsWithDetails;
    } catch (error) {
      throw new Error("Failed to get saved posts");
    }
  }
};

module.exports = profileService;
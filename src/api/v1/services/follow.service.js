const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const followService = {
  toggleFollow: async (data) => {
    const { followerId, followingId } = data;

    if (followerId == followingId) {
      throw new Error("Cannot follow yourself");
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(followingId) }
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: parseInt(followerId),
        followingId: parseInt(followingId)
      }
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      return { following: false };
    }

    await prisma.follow.create({
      data: {
        followerId: parseInt(followerId),
        followingId: parseInt(followingId)
      }
    });

    return { following: true };
  },

  getFollowers: async (userId) => {
    return await prisma.follow.findMany({
      where: { followingId: parseInt(userId) },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  getFollowing: async (userId) => {
    return await prisma.follow.findMany({
      where: { followerId: parseInt(userId) },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
};

module.exports = followService;

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

  getFollowers: async (userId, currentUserId) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    const followers = await prisma.follow.findMany({
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

    const followersWithDetails = await Promise.all(
      followers.map(async (follow) => {
        const isMyself = follow.follower.id === parseInt(currentUserId);
        
        let isFollowing = false;
        if (!isMyself) {
          const followStatus = await prisma.follow.findFirst({
            where: {
              followerId: parseInt(currentUserId),
              followingId: follow.follower.id
            }
          });
          isFollowing = !!followStatus;
        }

        return {
          id: follow.id,
          user: {
            ...follow.follower,
            isMyself,
            isFollowing
          },
          createdAt: follow.createdAt
        };
      })
    );

    return followersWithDetails;
  },

  getFollowings: async (userId, currentUserId) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    const following = await prisma.follow.findMany({
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

    const followingWithDetails = await Promise.all(
      following.map(async (follow) => {
        const isMyself = follow.following.id === parseInt(currentUserId);
        
        let isFollowing = false;
        if (!isMyself) {
          const followStatus = await prisma.follow.findFirst({
            where: {
              followerId: parseInt(currentUserId),
              followingId: follow.following.id
            }
          });
          isFollowing = !!followStatus;
        }

        return {
          id: follow.id,
          user: {
            ...follow.following,
            isMyself,
            isFollowing
          },
          createdAt: follow.createdAt
        };
      })
    );

    return followingWithDetails;
  }
};

module.exports = followService;

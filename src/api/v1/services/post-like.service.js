const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const postLikeService = {
    toggleLike: async (data) => {
        const { postId, userId } = data;
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });

        if (!post) {
            throw new NotFoundError("Post");
        }

        const existingLike = await prisma.postLike.findFirst({
            where: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });

        if (existingLike) {
            await prisma.postLike.delete({
                where: { id: existingLike.id }
            });
            return { liked: false };
        }

        await prisma.postLike.create({
            data: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });

        return { liked: true };
    },

    getPostLikes: async (postId, currentUserId) => {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });
    
        if (!post) {
            throw new NotFoundError("Post");
        }
    
        const postLikes = await prisma.postLike.findMany({
            where: {
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    
        const postLikesWithDetails = await Promise.all(
            postLikes.map(async (like) => {
                const isMyself = like.user.id === parseInt(currentUserId);
    
                let isFollowing = false;
                if (!isMyself) {
                    const followStatus = await prisma.follow.findFirst({
                        where: {
                            followerId: parseInt(currentUserId),
                            followingId: like.user.id
                        }
                    });
                    isFollowing = !!followStatus;
                }
    
                return {
                    id: like.id,
                    user: {
                        ...like.user,
                        isMyself,
                        isFollowing
                    },
                    createdAt: like.createdAt
                };
            })
        );
    
        return postLikesWithDetails;
    }
};

module.exports = postLikeService;
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

    getPostLikes: async (postId) => {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });

        if (!post) {
            throw new NotFoundError("Post");
        }

        return await prisma.postLike.findMany({
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
    }
};

module.exports = postLikeService;
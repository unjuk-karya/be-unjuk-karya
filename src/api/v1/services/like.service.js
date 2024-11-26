const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const likeService = {
    toggleLike: async (data) => {
        const { postId, userId } = data;
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });

        if (!post) {
            throw new NotFoundError("Post");
        }

        const existingLike = await prisma.like.findFirst({
            where: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return { liked: false };
        }

        await prisma.like.create({
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

        return await prisma.like.findMany({
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

module.exports = likeService;
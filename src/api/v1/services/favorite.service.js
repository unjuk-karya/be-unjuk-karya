const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const favoriteService = {
    toggleFavorite: async (data) => {
        const { postId, userId } = data;

        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });

        if (!post) {
            throw new NotFoundError("Post");
        }

        const existingFavorite = await prisma.favorite.findFirst({
            where: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });

        if (existingFavorite) {
            await prisma.favorite.delete({
                where: { id: existingFavorite.id }
            });
            return { favorited: false };
        }

        await prisma.favorite.create({
            data: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });

        return { favorited: true };
    }
};

module.exports = favoriteService;
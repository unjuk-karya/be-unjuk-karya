const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const saveService = {
    toggleSave: async (data) => {
        const { postId, userId } = data;

        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });

        if (!post) {
            throw new NotFoundError("Post");
        }

        const existingSave = await prisma.save.findFirst({
            where: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });

        if (existingSave) {
            await prisma.save.delete({
                where: { id: existingSave.id }
            });
            return { saved: false };
        }

        await prisma.save.create({
            data: {
                postId: parseInt(postId),
                userId: parseInt(userId)
            }
        });
        return { saved: true };
    }
};

module.exports = saveService;
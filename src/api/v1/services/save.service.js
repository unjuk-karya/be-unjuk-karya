const { NotFoundError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const saveService = {
    toggleSave: async (data) => {
        const { productId, userId } = data;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId), deletedAt: null }
        });

        if (!product) {
            throw new NotFoundError("Product");
        }

        const existingSave = await prisma.save.findFirst({
            where: {
                productId: parseInt(productId),
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
                productId: parseInt(productId),
                userId: parseInt(userId)
            }
        });
        return { saved: true };
    }
};

module.exports = saveService;
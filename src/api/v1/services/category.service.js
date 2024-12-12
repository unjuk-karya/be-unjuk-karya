const prisma = require('../../../config/prisma');

const categoryService = {
  getAllCategories: async () => {
    try {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc'
        }
      });

      return categories;
    } catch (error) {
      throw new Error("Failed to get categories");
    }
  }
};

module.exports = categoryService;
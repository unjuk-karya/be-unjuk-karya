const { handleValidation, NotFoundError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bucket = require('../../../config/gcs');

const productService = {
  createProduct: async (data) => {
    const { userId, name, description, price, stock, image, categoryId } = data;

    handleValidation({
      name: { value: name, message: "The name field is required." },
      description: { value: description, message: "The description field is required." },
      price: { value: price, message: "The price field is required." },
      stock: { value: stock, message: "The stock field is required." },
      image: { value: image, message: "The image field is required." },
      categoryId: { value: categoryId, message: "The category field is required." }
    });

    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    try {
      return await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          image,
          userId: parseInt(userId),
          categoryId: parseInt(categoryId)
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
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      throw new Error("Failed to create product");
    }
  },

  updateProduct: async (data) => {
    const { id, userId, name, description, price, stock, image, categoryId } = data;

    handleValidation({
      name: { value: name, message: "The name field is required." },
      description: { value: description, message: "The description field is required." },
      price: { value: price, message: "The price field is required." },
      stock: { value: stock, message: "The stock field is required." },
      categoryId: { value: categoryId, message: "The category field is required." }
    });

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      throw new NotFoundError("Product");
    }

    if (existingProduct.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to update this product");
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    try {
      if (image && existingProduct.image) {
        const oldImageName = existingProduct.image.split('/').pop();
        try {
          await bucket.file(`products/${oldImageName}`).delete();
        } catch (err) {
          throw new Error("Failed to delete old image");
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          price,
          stock,
          image: image || existingProduct.image,
          categoryId: parseInt(categoryId)
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
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return updatedProduct;

    } catch (error) {
      if (image) {
        const newImageName = image.split('/').pop();
        try {
          await bucket.file(`products/${newImageName}`).delete();
        } catch (deleteErr) {
          throw new Error("Failed to delete new image after update error");
        }
      }
      throw error;
    }
  },

  deleteProduct: async (data) => {
    const { id, userId } = data;

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      throw new NotFoundError("Product");
    }

    if (existingProduct.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to delete this product");
    }

    try {
      if (existingProduct.image) {
        const imageName = existingProduct.image.split('/').pop();
        try {
          await bucket.file(`products/${imageName}`).delete();
        } catch (err) {
          throw new Error("Failed to delete image");
        }
      }

      await prisma.product.delete({
        where: { id: parseInt(id) }
      });

      return true;
    } catch (error) {
      throw new Error("Failed to delete product");
    }
  },

  getProductById: async (id) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!product) {
        throw new NotFoundError("Product");
      }

      return product;

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Failed to get product");
    }
  },

  getAllProducts: async (page = 1, pageSize = 10, categoryId = null) => {
    try {
      const skip = (page - 1) * pageSize;

      const where = categoryId ? { categoryId: parseInt(categoryId) } : {};

      const products = await prisma.product.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      });

      const totalProducts = await prisma.product.count({ where });

      return {
        products,
        pagination: {
          currentPage: page,
          pageSize,
          totalProducts,
          totalPages: Math.ceil(totalProducts / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get all products");
    }
  }
};

module.exports = productService;
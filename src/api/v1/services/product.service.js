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
      // if (image && existingProduct.image) {
      //   const oldImageName = existingProduct.image.split('/').pop();
      //   try {
      //     await bucket.file(`products/${oldImageName}`).delete();
      //   } catch (err) {
      //     throw new Error("Failed to delete old image");
      //   }
      // }

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
      // if (image) {
      //   const newImageName = image.split('/').pop();
      //   try {
      //     await bucket.file(`products/${newImageName}`).delete();
      //   } catch (deleteErr) {
      //     throw new Error("Failed to delete new image after update error");
      //   }
      // }
      // throw error;
    }
  },

  deleteProduct: async (data) => {
    const { id, userId } = data;
  
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: parseInt(id),
        deletedAt: null
      }
    });
  
    if (!existingProduct) {
      throw new NotFoundError("Product");
    }
  
    if (existingProduct.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to delete this product");
    }
  
    try {
      await prisma.save.deleteMany({
        where: { productId: parseInt(id) }
      });
  
      await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          deletedAt: new Date(),
        }
      });
  
      return true;
    } catch (error) {
      throw new Error("Failed to delete product");
    }
  },

  getProductById: async (id, userId) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id), deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              products: {
                where: { deletedAt: null },
                include: {
                  orders: {
                    where: { status: 'PAID' },
                    include: {
                      reviews: {
                        select: { rating: true }
                      }
                    }
                  }
                }
              }
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              orders: {
                where: { status: 'PAID' }
              }
            }
          },
          orders: {
            where: { status: 'PAID' },
            include: {
              reviews: {
                select: {
                  rating: true
                }
              }
            }
          },
          saves: {
            where: { userId: parseInt(userId) }
          }
        }
      });
  
      if (!product) {
        throw new NotFoundError("Product");
      }
  
      const ratings = product.orders.flatMap(order => order.reviews.map(review => review.rating));
      const averageRating = ratings.length > 0 ? 
        ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length : 0;
  
      const sellerRatings = product.user.products
        .flatMap(prod => prod.orders
          .flatMap(order => order.reviews
            .map(review => review.rating)));
  
      const isMyself = product.user.id === parseInt(userId);
  
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image: product.image,
        userId: product.userId,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        deletedAt: product.deletedAt,
        user: {
          id: product.user.id,
          name: product.user.name,
          username: product.user.username,
          avatar: product.user.avatar,
          totalProducts: product.user.products.length,
          sellerRating: sellerRatings.length > 0 ? 
            Number((sellerRatings.reduce((a, b) => a + b, 0) / sellerRatings.length).toFixed(1)) : 0,
          totalSellerRatings: sellerRatings.length
        },
        category: {
          id: product.category.id,
          name: product.category.name
        },
        totalPurchases: product._count.orders,
        rating: Number(averageRating.toFixed(1)),
        totalRatings: ratings.length,
        isSaved: product.saves.length > 0,
        isMyself
      };
  
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Failed to get product");
    }
  },

  getAllProducts: async (page = 1, pageSize = 10, userId) => {
    try {
      const skip = (page - 1) * pageSize;
      const where = { deletedAt: null };
  
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
          },
          orders: {
            where: { status: 'PAID' },
            include: {
              reviews: {
                select: { rating: true }
              }
            }
          },
          saves: {
            where: { userId: parseInt(userId) }
          },
          _count: {
            select: {
              orders: {
                where: { status: 'PAID' }
              }
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      });
  
      const totalProducts = await prisma.product.count({ where });
  
      const productsWithDetails = products.map(product => {
        const ratings = product.orders.flatMap(order => order.reviews.map(review => review.rating));
        const averageRating = ratings.length > 0 ? 
          ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length : 0;
  
        const { _count, orders, saves, ...productData } = product;
        return {
          ...productData,
          rating: Number(averageRating.toFixed(1)),
          sold: _count.orders,
          isSaved: saves.length > 0
        };
      });
  
      return {
        products: productsWithDetails,
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
  },

  getProductReviews: async (id, page = 1, pageSize = 10) => {
    try {
      const skip = (page - 1) * pageSize;
  
      const reviews = await prisma.review.findMany({
        where: {
          order: {
            productId: parseInt(id) 
          }
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
          order: {
            select: {
              productName: true,
              productImage: true
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      });
  
      const totalReviews = await prisma.review.count({
        where: {
          order: {
            productId: parseInt(id)
          }
        }
      });
  
      return {
        reviews,
        pagination: {
          currentPage: page,
          pageSize,
          totalReviews,
          totalPages: Math.ceil(totalReviews / pageSize)
        }
      };
    } catch (error) {
      throw new Error("Failed to get reviews");
    }
  }
};

module.exports = productService;
const { handleValidation, NotFoundError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const reviewService = {
  createReview: async (data) => {
    const { userId, orderId, rating, comment } = data;

    handleValidation({
      rating: { value: rating, message: "The rating field is required." },
      comment: { value: comment, message: "The comment field is required." }
    });

    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(orderId),
        status: 'PAID'
      }
    });

    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to review this order");
    }

    const existingReview = await prisma.review.findFirst({
      where: { orderId: parseInt(orderId) }
    });

    if (existingReview) {
      throw new Error("You have already reviewed this order");
    }

    try {
      return await prisma.review.create({
        data: {
          rating,
          comment,
          userId: parseInt(userId),
          orderId: parseInt(orderId)
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
        }
      });
    } catch (error) {
      throw new Error("Failed to create review");
    }
  },

  updateReview: async (data) => {
    const { id, userId, orderId, rating, comment } = data;

    handleValidation({
      rating: { value: rating, message: "The rating field is required." },
      comment: { value: comment, message: "The comment field is required." }
    });

    const existingReview = await prisma.review.findFirst({
      where: { 
        id: parseInt(id),
        orderId: parseInt(orderId)
      }
    });

    if (!existingReview) {
      throw new NotFoundError("Review");
    }

    if (existingReview.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to update this review");
    }

    try {
      return await prisma.review.update({
        where: { id: parseInt(id) },
        data: { rating, comment },
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
        }
      });
    } catch (error) {
      throw new Error("Failed to update review");
    }
  },

  deleteReview: async (data) => {
    const { id, userId, orderId } = data;

    const existingReview = await prisma.review.findFirst({
      where: { 
        id: parseInt(id),
        orderId: parseInt(orderId)
      }
    });

    if (!existingReview) {
      throw new NotFoundError("Review");
    }

    if (existingReview.userId !== parseInt(userId)) {
      throw new UnauthorizedError("You are not authorized to delete this review");
    }

    try {
      await prisma.review.delete({
        where: { id: parseInt(id) }
      });
      return true;
    } catch (error) {
      throw new Error("Failed to delete review");
    }
  }
};

module.exports = reviewService;
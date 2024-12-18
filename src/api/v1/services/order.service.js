const { handleValidation, NotFoundError, ValidationError, UnauthorizedError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const dotenv = require('dotenv');

dotenv.config();
const Midtrans = require('midtrans-client');

const snap = new Midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const coreApi = new Midtrans.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const orderService = {
    createOrder: async (data) => {
        const { userId, productId, quantity } = data;

        handleValidation({
            productId: { value: productId, message: "The productId field is required" },
            quantity: { value: quantity, message: "The quantity field is required" }
        });

        if (!Number.isInteger(productId) || productId <= 0) {
            throw new ValidationError({ productId: "The productId field must be a positive number" });
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new ValidationError({ quantity: "The quantity field must be a positive number" });
        }

        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId), deletedAt: null }
        });

        if (!product) {
            throw new NotFoundError("Product");
        }

        if (product.stock < quantity) {
            throw new Error("Insufficient stock");
        }

        try {
            const totalAmount = product.price * quantity;
            const paymentDue = new Date();
            paymentDue.setHours(paymentDue.getHours() + 24);

            const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const transactionDetails = {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: totalAmount
                },
                expiry: {
                    unit: "hours",
                    duration: 24
                }
            };

            const midtransResponse = await snap.createTransaction(transactionDetails);

            const order = await prisma.order.create({
                data: {
                    orderId: orderId,
                    userId: parseInt(userId),
                    productId: parseInt(productId),
                    quantity,
                    totalAmount,
                    productName: product.name,
                    productPrice: product.price,
                    productImage: product.image,
                    snapToken: midtransResponse.token,
                    redirectUrl: midtransResponse.redirect_url,
                    paymentDue,
                    status: "PENDING"
                }
            });

            await prisma.product.update({
                where: { id: parseInt(productId) },
                data: { stock: product.stock - quantity }
            });

            return {
                order,
            };

        } catch (error) {
            throw new Error(`Failed to create order: ${error.message}`);
        }
    },

    cancelOrder: async (data) => {
        const { orderId, userId } = data;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) }
        });

        if (!order) {
            throw new NotFoundError("Order");
        }

        if (order.userId !== parseInt(userId)) {
            throw new UnauthorizedError("You are not authorized to cancel this order");
        }

        if (order.status !== "PENDING") {
            throw new Error("Only pending orders can be cancelled");
        }

        try {
            const cancelledOrder = await prisma.order.update({
                where: { id: parseInt(orderId) },
                data: { status: "CANCELED" }
            });

            try {
                const product = await prisma.product.findUnique({
                    where: { id: order.productId }
                });

                if (product) {
                    await prisma.product.update({
                        where: { id: order.productId, deletedAt: null },
                        data: {
                            stock: {
                                increment: order.quantity
                            }
                        }
                    });
                } else {
                    console.log(`Product with ID ${order.productId} has been deleted. Stock return skipped.`);
                }
            } catch (stockError) {
                console.error(`Failed to handle stock return: ${stockError.message}`);
            }

            try {
                await snap.transaction.cancel(order.orderId);
            } catch (midtransError) {
                console.log(`Failed to cancel in Midtrans but local cancelled: ${midtransError.message}`);
            }

            return cancelledOrder;

        } catch (error) {
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    },

    handleNotification: async (notification) => {
        try {
            const statusResponse = await coreApi.transaction.notification(notification);

            const orderId = statusResponse.order_id;
            const transactionStatus = statusResponse.transaction_status;
            const fraudStatus = statusResponse.fraud_status;

            const order = await prisma.order.findFirst({
                where: { orderId }
            });

            if (!order) {
                throw new NotFoundError("Order");
            }

            if (order.status === 'CANCELED') {
                try {
                    await snap.transaction.cancel(orderId);
                } catch (cancelError) {
                    console.log(`Failed to cancel Midtrans transaction: ${cancelError.message}`);
                }
                return order;
            }

            let orderStatus;
            let shouldReturnStock = false;

            if (transactionStatus == 'capture') {
                if (fraudStatus == 'challenge') {
                    orderStatus = 'PENDING';
                } else if (fraudStatus == 'accept') {
                    orderStatus = 'PAID';
                }
            } else if (transactionStatus == 'settlement') {
                orderStatus = 'PAID';
            } else if (transactionStatus == 'cancel') {
                orderStatus = 'CANCELED';
            } else if (transactionStatus == 'deny' || transactionStatus == 'expire') {
                orderStatus = 'EXPIRED';
                shouldReturnStock = true;
            } else if (transactionStatus == 'pending') {
                orderStatus = 'PENDING';
            }

            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: orderStatus,
                    paidAt: orderStatus === 'PAID' ? new Date() : null
                }
            });

            if (shouldReturnStock) {
                try {
                    const product = await prisma.product.findUnique({
                        where: { id: order.productId, deletedAt: null }
                    });

                    if (product) {
                        await prisma.product.update({
                            where: { id: order.productId, deletedAt: null },
                            data: {
                                stock: {
                                    increment: order.quantity
                                }
                            }
                        });
                    } else {
                        console.log(`Product with ID ${order.productId} has been deleted. Stock return skipped for order ${order.id}`);
                    }
                } catch (stockError) {
                    console.error(`Failed to return stock for order ${order.id}: ${stockError.message}`);
                }
            }

            return updatedOrder;

        } catch (error) {
            throw new Error(`Notification handling failed: ${error.message}`);
        }
    },

    getTransactionHistory: async (userId, page = 1, pageSize = 10) => {
        try {
            const skip = (page - 1) * pageSize;
    
            const orders = await prisma.order.findMany({
                where: { userId: parseInt(userId) },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            image: true,
                            user: {
                                select: {
                                    id: true,
                                    username: true
                                }
                            }
                        }
                    },
                    reviews: {
                        select: {
                            id: true
                        }
                    }
                },
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: 'desc'
                }
            });
    
            const totalOrders = await prisma.order.count({
                where: { userId: parseInt(userId) }
            });
    
            const ordersWithStoreDetails = await Promise.all(orders.map(async order => {
                const { product, reviews, ...orderData } = order;
    
                if (order.status === 'PENDING' && !order.paidAt && new Date(order.paymentDue) < new Date()) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'EXPIRED' }
                    });
                    orderData.status = 'EXPIRED';
                }
    
                return {
                    ...orderData,
                    storeId: product.user.id,
                    storeName: product.user.username,
                    reviewId: reviews.length > 0 ? reviews[0].id : null,
                };
            }));
    
            return {
                orders: ordersWithStoreDetails,
                pagination: {
                    currentPage: page,
                    pageSize,
                    totalOrders,
                    totalPages: Math.ceil(totalOrders / pageSize)
                }
            };
        } catch (error) {
            throw new Error("Failed to get transaction history");
        }
    }
};

module.exports = orderService;
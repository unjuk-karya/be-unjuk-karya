const { handleValidation, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');

const postService = {
  createPost: async (data) => {
    const { userId, title, content, image } = data;

    handleValidation({
      title: { value: title, message: "The title field is required." },
      content: { value: content, message: "The content field is required." },
      image: { value: image, message: "The image field is required." }
    });

    try {
      const post = await prisma.post.create({
        data: {
          title,
          content,
          image,
          userId: parseInt(userId)
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });

      return post;
    } catch (error) {
      throw new ValidationError({
        database: ["Failed to create post."]
      });
    }
  }
};

module.exports = postService;
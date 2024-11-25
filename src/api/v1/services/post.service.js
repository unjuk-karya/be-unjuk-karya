const { handleValidation, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const fs = require('fs').promises;

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
  },
  updatePost: async (data) => {
    const { id, userId, title, content, image } = data;

    handleValidation({
      title: { value: title, message: "The title field is required." },
      content: { value: content, message: "The content field is required." }
    });

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      throw new ValidationError({
        post: ["Post not found."]
      });
    }

    if (existingPost.userId !== parseInt(userId)) {
      throw new ValidationError({
        auth: ["Unauthorized to update this post."]
      });
    }

    try {
      if (image && existingPost.image) {
        await fs.unlink(existingPost.image)
          .catch(err => console.error('Error deleting old image:', err));
      }

      const post = await prisma.post.update({
        where: { id: parseInt(id) },
        data: {
          title,
          content,
          image: image || existingPost.image
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
      if (image) {
        await fs.unlink(image)
          .catch(err => console.error('Error deleting new image:', err));
      }
      throw new ValidationError({
        database: ["Failed to update post."]
      });
    }
  }
};

module.exports = postService;
const { NotFoundError, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bucket = require('../../../config/gcs');

const profileService = {
  updateProfile: async (data) => {
      const { id, email, username, name, phone, address, bio, avatar, coverPhoto } = data;
  
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });
  
      if (!existingUser) {
        throw new NotFoundError("User");
      }
  
      const errors = {};
  
      if (email !== undefined && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists) {
          errors.email = ["The email has already been taken."];
        }
      }
  
      if (username !== undefined && username !== existingUser.username) {
        const usernameExists = await prisma.user.findUnique({ where: { username } });
        if (usernameExists) {
          errors.username = ["The username has already been taken."];
        }
      }
  
      if (Object.keys(errors).length > 0) {
        throw new ValidationError(errors);
      }
  
      try {
        const updateData = {};
  
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (username !== undefined) updateData.username = username;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (bio !== undefined) updateData.bio = bio;
        
        if (avatar) {
          updateData.avatar = avatar;
          if (existingUser.avatar) {
              const oldAvatarName = existingUser.avatar.split('/').pop();
              try {
                  await bucket.file(`avatars/${oldAvatarName}`).delete();
              } catch (err) {
                  throw new Error("Failed to delete old avatar");
              }
          }
        }

        if (coverPhoto) {
          updateData.coverPhoto = coverPhoto;
          if (existingUser.coverPhoto) {
              const oldCoverName = existingUser.coverPhoto.split('/').pop();
              try {
                  await bucket.file(`covers/${oldCoverName}`).delete();
              } catch (err) {
                  throw new Error("Failed to delete old cover photo");
              }
          }
        }
  
        const updatedUser = await prisma.user.update({
          where: { id: parseInt(id) },
          data: updateData,
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            phone: true,
            address: true,
            bio: true,
            avatar: true,
            coverPhoto: true,
            createdAt: true,
            updatedAt: true
          }
        });
  
        return updatedUser;
  
      } catch (error) {
        if (avatar) {
          const newAvatarName = avatar.split('/').pop();
          try {
              await bucket.file(`avatars/${newAvatarName}`).delete();
          } catch (deleteErr) {}
        }
        if (coverPhoto) {
          const newCoverName = coverPhoto.split('/').pop();
          try {
              await bucket.file(`covers/${newCoverName}`).delete();
          } catch (deleteErr) {}
        }
        throw error;
      }
  },
};

module.exports = profileService;
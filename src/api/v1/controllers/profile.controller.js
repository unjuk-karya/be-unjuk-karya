const profileService = require('../services/profile.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');
const bucket = require('../../../config/gcs');

const profileController = {
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email, username, phone, address, bio } = req.body;
      const avatar = req.file?.cloudStoragePublicUrl;

      const result = await profileService.updateProfile({
        id: userId,
        name,
        email,
        username,
        phone,
        address,
        bio,
        avatar
      });

      return res.json(
        createSuccessResponse(result, "Profile updated successfully")
      );
    } catch (error) {
      if (req.file?.cloudStoragePublicUrl) {
        try {
          const imagePath = new URL(req.file.cloudStoragePublicUrl).pathname.split('/').slice(2).join('/');
          await bucket.file(imagePath).delete();
        } catch (err) {
          
        }
      }
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = profileController;
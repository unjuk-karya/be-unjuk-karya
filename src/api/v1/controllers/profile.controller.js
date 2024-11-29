const profileService = require('../services/profile.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');
const fs = require('fs').promises;

const profileController = {
    updateProfile: async (req, res) => {
        try {
          const userId = req.user.id;
          const { name, email, username, phone, address, bio } = req.body;
          const avatar = req.file?.path;
    
          try {
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
            if (avatar) {
              await fs.unlink(avatar)
                .catch(err => console.error('Error deleting file:', err));
            }
            throw error;
          }
        } catch (error) {
          return res.status(error.status || 500).json(createErrorResponse(error));
        }
      }
};

module.exports = profileController;
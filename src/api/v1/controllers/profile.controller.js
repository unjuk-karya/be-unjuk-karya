const profileService = require('../services/profile.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');
const bucket = require('../../../config/gcs');

const profileController = {
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email, username, phone, address, bio } = req.body;
      const avatar = req.files?.avatar?.[0]?.cloudStoragePublicUrl;
      const coverPhoto = req.files?.coverPhoto?.[0]?.cloudStoragePublicUrl;

      const result = await profileService.updateProfile({
        id: userId,
        name,
        email,
        username,
        phone,
        address,
        bio,
        avatar,
        coverPhoto
      });

      return res.json(
        createSuccessResponse(result, "Profile updated successfully")
      );
    } catch (error) {
      if (req.files?.avatar?.[0]?.cloudStoragePublicUrl) {
        try {
          const imagePath = new URL(req.files.avatar[0].cloudStoragePublicUrl).pathname.split('/').slice(2).join('/');
          await bucket.file(imagePath).delete();
        } catch (err) {}
      }
      if (req.files?.coverPhoto?.[0]?.cloudStoragePublicUrl) {
        try {
          const imagePath = new URL(req.files.coverPhoto[0].cloudStoragePublicUrl).pathname.split('/').slice(2).join('/');
          await bucket.file(imagePath).delete();
        } catch (err) {}
      }
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },
  getUserProfile: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      
      const result = await profileService.getUserProfile(userId, currentUserId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },
  getUserPosts: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      
      const result = await profileService.getUserPosts(userId, currentUserId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getUserLikedPosts: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      
      const result = await profileService.getUserLikedPosts(userId, currentUserId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  },

  getUserSavedPosts: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user.id;
      
      const result = await profileService.getUserSavedPosts(userId, currentUserId);
      return res.json(createSuccessResponse(result));
    } catch (error) {
      return res.status(error.status || 500).json(createErrorResponse(error));
    }
  }
};

module.exports = profileController;
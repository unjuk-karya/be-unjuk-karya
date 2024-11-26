const favoriteService = require('../services/favorite.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const favoriteController = {
    toggleFavorite: async (req, res) => {
        try {
            const userId = req.user.id;
            const { postId } = req.params;

            const result = await favoriteService.toggleFavorite({ postId, userId });
            return res.json(createSuccessResponse(result,
                result.favorited ? "Post added to favorites" : "Post removed from favorites"
            ));
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    }
};

module.exports = favoriteController;
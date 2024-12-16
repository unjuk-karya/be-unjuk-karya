const saveService = require('../services/save.service');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/responseHandler');

const saveController = {
    toggleSave: async (req, res) => {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            const result = await saveService.toggleSave({ productId, userId });
            return res.json(createSuccessResponse(result,
                result.saved ? "Product saved successfully" : "Product unsaved successfully"
            ));
        } catch (error) {
            return res.status(error.status || 500).json(createErrorResponse(error));
        }
    }
};

module.exports = saveController;
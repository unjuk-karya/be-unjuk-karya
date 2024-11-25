const jwt = require('jsonwebtoken');
const { UnauthorizedError, createErrorResponse } = require('../../../utils/responseHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const bearerHeader = req.headers.authorization;
    if (!bearerHeader) {
      throw new UnauthorizedError("Authorization header is required");
    }

    const [bearer, token] = bearerHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedError("Invalid authorization format. Use 'Bearer <token>'");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.id) {
        throw new UnauthorizedError("Invalid token format - no user ID");
      }

      req.user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired token");
    }

  } catch (error) {
    return res.status(error.status || 401).json(createErrorResponse(error));
  }
};

module.exports = authMiddleware;
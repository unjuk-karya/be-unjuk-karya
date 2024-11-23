const jwt = require('jsonwebtoken');
const { ValidationError } = require('../../../utils/responseHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const bearerHeader = req.headers.authorization;
    if (!bearerHeader) {
      throw new ValidationError({
        auth: ["Authorization header is required"]
      });
    }

    const [bearer, token] = bearerHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new ValidationError({
        auth: ["Invalid authorization format. Use 'Bearer <token>'"]
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.id) {
        throw new ValidationError({
          auth: ["Invalid token format - no user ID"]
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      throw new ValidationError({
        auth: ["Invalid or expired token"]
      });
    }

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Unauthorized',
      errors: error.errors || { auth: ["Unauthorized access"] }
    });
  }
};

module.exports = authMiddleware;
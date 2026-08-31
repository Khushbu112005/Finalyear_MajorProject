import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verify JWT token and attach user to request object
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed: Malformed Bearer token.',
        });
      }

      // Verify token
      const secret = process.env.JWT_SECRET || 'civicsphere_fallback_jwt_secret_key_2026';
      const decoded = jwt.verify(token, secret);

      // Find user by ID without returning password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed: User no longer exists.',
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid or expired token. Please log in again.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided.',
    });
  }
};

export default protect;

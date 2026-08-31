import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's role ('CITIZEN' | 'LAWYER')
 * @returns {string} Signed JWT string
 */
export const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'civicsphere_fallback_jwt_secret_key_2026';
  return jwt.sign({ id: userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

export default generateToken;

/**
 * Middleware to restrict access based on user roles (RBAC)
 * @param  {...string} roles - Allowed roles (e.g. 'CITIZEN', 'LAWYER')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role authorizations.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${roles.join(
          ', '
        )}`,
      });
    }

    next();
  };
};

export default authorizeRoles;

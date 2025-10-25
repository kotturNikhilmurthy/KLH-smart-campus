/**
 * Ensures the authenticated user owns one of the required roles.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden", data: null });
    }

    next();
  };
};

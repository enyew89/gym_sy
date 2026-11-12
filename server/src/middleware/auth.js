/**
 * Authentication and Role-Based Authorization Middleware
 */

export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in.',
  });
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}. Your role is: ${req.user.role}`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireTrainer = requireRole('trainer', 'admin');
export const requireReceptionist = requireRole('receptionist', 'admin');
export const requireMember = requireRole('member', 'admin');

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = req.user.role === 'company_admin' ? 'admin' : req.user.role;
  const allowedRoles = roles.map(r => r === 'company_admin' ? 'admin' : r);
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Access denied for this role' });
  }
  next();
};

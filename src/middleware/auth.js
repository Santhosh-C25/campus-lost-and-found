/**
 * Authentication & authorisation middleware
 */

// Ensure the user is logged in
exports.requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  next();
};

// Ensure the logged-in user is an admin
exports.requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

// Attach basic session info to every request so controllers can use req.user
exports.attachUser = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      role: req.session.userRole,
      name: req.session.userName,
      email: req.session.userEmail,
    };
  }
  next();
};

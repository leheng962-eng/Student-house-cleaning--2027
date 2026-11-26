const jwt = require('jsonwebtoken');

// Check the login token sent in the "Authorization: Bearer <token>" header
exports.protect = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Please login first' }); }
};

// Allow only some roles, e.g. adminOnly
exports.adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agri_super_secret_jwt_key_2060_enterprise_secure_token_9918237';

const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.agri_token) {
      token = req.cookies.agri_token;
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No active security session token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please re-authenticate.',
      error: err.name
    });
  }
};

module.exports = authMiddleware;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

// Verify user has access to the requested guild
const guildAccess = async (req, res, next) => {
  const guildId = req.params.guildId || req.body.guildId || req.query.guildId;
  if (!guildId) return next();

  if (!req.user.guilds.includes(guildId) && req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'No access to this guild' });
  }
  next();
};

// Verify internal bot API key
const botAuth = (req, res, next) => {
  const apiKey = req.headers['x-bot-api-key'];
  if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid bot API key' });
  }
  next();
};

// Verify either user JWT or bot API key
const eitherAuth = async (req, res, next) => {
  const apiKey = req.headers['x-bot-api-key'];
  if (apiKey && apiKey === process.env.BOT_API_KEY) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, authorize, guildAccess, botAuth, eitherAuth };

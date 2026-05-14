const router = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

// GET /auth/discord - Redirect to Discord OAuth
router.get('/discord', authLimiter, (req, res) => {
  const scope = 'identify email guilds';
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  res.redirect(url);
});

// GET /auth/discord/callback - Handle OAuth callback
router.get('/discord/callback', authLimiter, async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }

  try {
    // Exchange code for token
    const tokenRes = await axios.post(`${DISCORD_API}/oauth2/token`, new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, refresh_token } = tokenRes.data;

    // Get user info
    const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Get user guilds
    const guildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const discordUser = userRes.data;
    // Filter guilds where user has MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8) permission or is owner
    const managedGuilds = guildsRes.data
      .filter(g => (g.permissions & 0x20) === 0x20 || (g.permissions & 0x8) === 0x8 || g.owner)
      .map(g => g.id);

    // Upsert user
    let user = await User.findOneAndUpdate(
      { discordId: discordUser.id },
      {
        username: discordUser.username,
        discriminator: discordUser.discriminator || '0',
        avatar: discordUser.avatar,
        email: discordUser.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        guilds: managedGuilds,
      },
      { upsert: true, new: true }
    );

    // First user becomes owner
    const userCount = await User.countDocuments();
    if (userCount === 1) {
      user.role = 'owner';
      await user.save();
    }

    const tokens = generateTokens(user._id);

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(
      `${frontendUrl}/login/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  } catch (error) {
    console.error('[Auth] Discord OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const tokens = generateTokens(user._id);
    res.json({ success: true, ...tokens });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// GET /auth/me - Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      discordId: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      email: req.user.email,
      role: req.user.role,
      guilds: req.user.guilds,
    },
  });
});

// POST /auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

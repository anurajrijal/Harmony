const router = require('express').Router();
const axios = require('axios');
const { authenticate, guildAccess } = require('../middleware/auth');
const Guild = require('../models/Guild');
const BotSettings = require('../models/BotSettings');

const User = require('../models/User');

// GET /api/guilds - Get user's manageable guilds with auto-sync
router.get('/', authenticate, async (req, res) => {
  try {
    // Optional: Refresh managed guilds from Discord API
    if (req.user.accessToken) {
      try {
        const discordRes = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
          headers: { Authorization: `Bearer ${req.user.accessToken}` }
        });
        
        const managedGuilds = discordRes.data
          .filter(g => (g.permissions & 0x20) === 0x20 || (g.permissions & 0x8) === 0x8 || g.owner)
          .map(g => g.id);

        console.log(`[Sync] Found ${managedGuilds.length} managed guilds from Discord for ${req.user.username}`);

        // Update user in DB only if we found guilds (Safety Lock)
        if (managedGuilds.length > 0) {
          await User.findByIdAndUpdate(req.user._id, { guilds: managedGuilds });
          req.user.guilds = managedGuilds;
        }
      } catch (err) {
        console.warn('[Sync] Failed to refresh guilds from Discord:', err.message);
      }
    }

    const [dbGuilds, ownedGuilds] = await Promise.all([
      Guild.find({ guildId: { $in: req.user.guilds } }),
      Guild.find({ ownerId: req.user.discordId })
    ]);

    // Merge and remove duplicates by guildId
    const allGuildsMap = new Map();
    [...dbGuilds, ...ownedGuilds].forEach(g => allGuildsMap.set(g.guildId, g));
    const guilds = Array.from(allGuildsMap.values());

    console.log(`[Sync] Returning ${guilds.length} total guilds where bot is present`);

    res.json({ success: true, guilds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/guilds/:guildId - Get guild details
router.get('/:guildId', authenticate, guildAccess, async (req, res) => {
  try {
    const guild = await Guild.findOne({ guildId: req.params.guildId });
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Guild not found' });
    }
    const settings = await BotSettings.findOne({ guildId: req.params.guildId });
    res.json({ success: true, guild, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/guilds/:guildId/channels - Get guild channels from Discord API
router.get('/:guildId/channels', authenticate, guildAccess, async (req, res) => {
  try {
    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${req.params.guildId}/channels`,
      { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
    );
    const channels = response.data.map(ch => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      position: ch.position,
    }));
    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch channels' });
  }
});

// GET /api/guilds/:guildId/roles - Get guild roles from Discord API
router.get('/:guildId/roles', authenticate, guildAccess, async (req, res) => {
  try {
    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${req.params.guildId}/roles`,
      { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
    );
    const roles = response.data.map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      position: r.position,
    }));
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
});

// GET /api/guilds/debug/all - List all guilds in DB (Diagnostic)
router.get('/debug/all', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ success: false });
  const guilds = await Guild.find({});
  res.json({ success: true, guilds });
});

module.exports = router;

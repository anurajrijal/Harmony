const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const MusicQueue = require('../models/MusicQueue');

// GET /api/music/queue/:guildId
router.get('/queue/:guildId', authenticate, async (req, res) => {
  try {
    const queue = await MusicQueue.findOne({ guildId: req.params.guildId });
    res.json({ success: true, queue: queue || { tracks: [], isPlaying: false } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/music/control - Send control commands to bot via socket
router.post('/control', authenticate, async (req, res) => {
  try {
    const { guildId, action, data } = req.body;
    if (!guildId || !action) {
      return res.status(400).json({ success: false, message: 'guildId and action required' });
    }

    const io = req.app.get('io');
    io.emit('music-control', { guildId, action, data, userId: req.user.discordId });

    res.json({ success: true, message: `Music command '${action}' sent` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

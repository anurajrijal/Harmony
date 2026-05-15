const express = require('express');
const router = express.Router();
const Greeting = require('../models/Greeting');

// Get greetings config for a guild
router.get('/', async (req, res) => {
  try {
    const { guildId } = req.query;
    if (!guildId) return res.status(400).json({ success: false, message: 'guildId is required' });

    let config = await Greeting.findOne({ guildId });
    if (!config) {
      config = await Greeting.create({ guildId });
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error('Fetch greeting config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update greetings config
router.post('/', async (req, res) => {
  try {
    const { guildId, enabled, welcomeChannelId, welcomeMessage, goodbyeChannelId, goodbyeMessage, welcomeImage, goodbyeImage, textColor, welcomeGifMode, goodbyeGifMode } = req.body;
    
    if (!guildId) return res.status(400).json({ success: false, message: 'guildId is required' });

    const config = await Greeting.findOneAndUpdate(
      { guildId },
      { enabled, welcomeChannelId, welcomeMessage, goodbyeChannelId, goodbyeMessage, welcomeImage, goodbyeImage, textColor, welcomeGifMode, goodbyeGifMode },
      { new: true, upsert: true }
    );

    // Notify bot via Socket.io to update cache
    const io = req.app.get('io');
    if (io) {
      io.emit('greeting-update', { guildId });
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error('Update greeting config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

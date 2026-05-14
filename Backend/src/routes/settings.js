const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { validate, botSettingsSchema } = require('../middleware/validate');
const BotSettings = require('../models/BotSettings');

router.get('/:guildId', authenticate, async (req, res) => {
  try {
    let settings = await BotSettings.findOne({ guildId: req.params.guildId });
    if (!settings) {
      settings = await BotSettings.create({ guildId: req.params.guildId });
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:guildId', authenticate, validate(botSettingsSchema), async (req, res) => {
  try {
    const settings = await BotSettings.findOneAndUpdate(
      { guildId: req.params.guildId },
      req.body,
      { new: true, upsert: true }
    );
    const io = req.app.get('io');
    io.to(`guild:${req.params.guildId}`).emit('settings-update', settings);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

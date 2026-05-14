const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const Log = require('../models/Log');

router.get('/', authenticate, async (req, res) => {
  try {
    const { guildId, type, limit = 50, page = 1 } = req.query;
    if (!guildId) return res.status(400).json({ success: false, message: 'guildId required' });
    const query = { guildId };
    if (type) query.type = type;
    const total = await Log.countDocuments(query);
    const logs = await Log.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await Log.create(req.body);
    const io = req.app.get('io');
    io.to(`guild:${log.guildId}`).emit('log-event', log);
    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

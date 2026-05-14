const router = require('express').Router();
const { authenticate, eitherAuth, guildAccess } = require('../middleware/auth');
const { validate, keywordSchema } = require('../middleware/validate');
const KeywordRule = require('../models/KeywordRule');

// GET /api/keywords?guildId=xxx
router.get('/', eitherAuth, async (req, res) => {
  try {
    const { guildId } = req.query;
    if (!guildId) return res.status(400).json({ success: false, message: 'guildId required' });
    const keywords = await KeywordRule.find({ guildId }).sort({ createdAt: -1 });
    res.json({ success: true, keywords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/keywords
router.post('/', authenticate, validate(keywordSchema), async (req, res) => {
  try {
    const { guildId } = req.body;
    if (!guildId) return res.status(400).json({ success: false, message: 'guildId required' });

    const keyword = await KeywordRule.create({
      ...req.body,
      createdBy: req.user.discordId,
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`guild:${guildId}`).emit('keyword-update', { action: 'created', guildId, keyword });

    res.status(201).json({ success: true, keyword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/keywords/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const keyword = await KeywordRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!keyword) return res.status(404).json({ success: false, message: 'Keyword not found' });

    const io = req.app.get('io');
    io.to(`guild:${keyword.guildId}`).emit('keyword-update', { action: 'updated', guildId: keyword.guildId, keyword });

    res.json({ success: true, keyword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/keywords/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const keyword = await KeywordRule.findByIdAndDelete(req.params.id);
    if (!keyword) return res.status(404).json({ success: false, message: 'Keyword not found' });

    const io = req.app.get('io');
    io.to(`guild:${keyword.guildId}`).emit('keyword-update', { action: 'deleted', guildId: keyword.guildId, keywordId: keyword._id });

    res.json({ success: true, message: 'Keyword deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/keywords/:id/toggle
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const keyword = await KeywordRule.findById(req.params.id);
    if (!keyword) return res.status(404).json({ success: false, message: 'Keyword not found' });

    keyword.enabled = !keyword.enabled;
    await keyword.save();

    const io = req.app.get('io');
    io.to(`guild:${keyword.guildId}`).emit('keyword-update', { action: 'toggled', guildId: keyword.guildId, keyword });

    res.json({ success: true, keyword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

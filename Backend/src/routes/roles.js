const router = require('express').Router();
const { authenticate, eitherAuth, guildAccess } = require('../middleware/auth');
const { validate, roleRuleSchema } = require('../middleware/validate');
const RoleRule = require('../models/RoleRule');

// GET /api/roles?guildId=xxx
router.get('/', eitherAuth, async (req, res) => {
  try {
    const { guildId } = req.query;
    if (!guildId) return res.status(400).json({ success: false, message: 'guildId required' });
    const rules = await RoleRule.find({ guildId }).sort({ createdAt: -1 });
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/roles
router.post('/', authenticate, validate(roleRuleSchema), async (req, res) => {
  try {
    const rule = await RoleRule.create({
      ...req.body,
      createdBy: req.user.discordId,
    });
    res.status(201).json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/roles/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const rule = await RoleRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Role rule not found' });
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/roles/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const rule = await RoleRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Role rule not found' });
    res.json({ success: true, message: 'Role rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/roles/:id/toggle
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const rule = await RoleRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Role rule not found' });
    rule.enabled = !rule.enabled;
    await rule.save();
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

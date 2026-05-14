const mongoose = require('mongoose');

const roleRuleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  type: { type: String, enum: ['auto-join', 'reaction', 'action'], required: true },
  roleId: { type: String, required: true },
  roleName: { type: String },
  // For reaction roles
  messageId: { type: String },
  channelId: { type: String },
  emoji: { type: String },
  // For action-based
  triggerAction: { type: String }, // e.g., 'message_count_100', 'voice_hours_10'
  triggerValue: { type: Number },
  enabled: { type: Boolean, default: true },
  createdBy: { type: String },
}, { timestamps: true });

roleRuleSchema.index({ guildId: 1, type: 1 });

module.exports = mongoose.model('RoleRule', roleRuleSchema);

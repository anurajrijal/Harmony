const mongoose = require('mongoose');

const botSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  musicEnabled: { type: Boolean, default: true },
  autoReplyEnabled: { type: Boolean, default: true },
  roleAutomationEnabled: { type: Boolean, default: true },
  allowedMusicChannels: [{ type: String }], // Channel IDs
  allowedCommandChannels: [{ type: String }],
  djRoleId: { type: String },
  defaultVolume: { type: Number, default: 50, min: 0, max: 100 },
  maxQueueSize: { type: Number, default: 100 },
  autoDisconnectTimeout: { type: Number, default: 300 }, // seconds
  is247Mode: { type: Boolean, default: false },
  welcomeChannelId: { type: String },
  welcomeMessage: { type: String },
  logChannelId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('BotSettings', botSettingsSchema);

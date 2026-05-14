const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  type: { type: String, enum: ['command', 'music', 'keyword', 'role', 'error', 'system'], required: true },
  action: { type: String, required: true },
  userId: { type: String },
  username: { type: String },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

logSchema.index({ guildId: 1, createdAt: -1 });
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30-day TTL

module.exports = mongoose.model('Log', logSchema);

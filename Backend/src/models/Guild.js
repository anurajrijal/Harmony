const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String },
  ownerId: { type: String, required: true },
  memberCount: { type: Number, default: 0 },
  botJoinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);

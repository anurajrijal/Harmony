const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  discriminator: { type: String, default: '0' },
  avatar: { type: String },
  email: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  guilds: [{ type: String }], // Array of guild IDs user has access to
  role: { type: String, enum: ['owner', 'admin', 'moderator', 'viewer'], default: 'viewer' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

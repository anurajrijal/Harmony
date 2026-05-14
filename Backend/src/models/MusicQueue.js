const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: String },
  thumbnail: { type: String },
  requestedBy: { type: String },
}, { _id: false });

const musicQueueSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  tracks: [trackSchema],
  currentTrack: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  volume: { type: Number, default: 50 },
  loop: { type: String, enum: ['off', 'track', 'queue'], default: 'off' },
  voiceChannelId: { type: String },
  textChannelId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('MusicQueue', musicQueueSchema);

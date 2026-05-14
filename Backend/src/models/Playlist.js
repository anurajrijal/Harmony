const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: String,
  url: String,
  duration: String,
  thumbnail: String,
});

const playlistSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  tracks: [trackSchema],
  createdBy: String,
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);

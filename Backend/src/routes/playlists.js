const router = require('express').Router();
const { authenticate, eitherAuth } = require('../middleware/auth');
const Playlist = require('../models/Playlist');

// Get all playlists for a guild
router.get('/', eitherAuth, async (req, res) => {
  try {
    const { guildId } = req.query;
    const playlists = await Playlist.find({ guildId });
    res.json({ success: true, playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new playlist
router.post('/', eitherAuth, async (req, res) => {
  try {
    const { guildId, name } = req.body;
    const newPlaylist = new Playlist({
      guildId,
      name,
      createdBy: req.user ? req.user.username : 'Bot',
      tracks: []
    });
    await newPlaylist.save();
    res.json({ success: true, playlist: newPlaylist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a playlist
router.delete('/:id', eitherAuth, async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a track to a playlist
router.post('/:id/tracks', eitherAuth, async (req, res) => {
  try {
    const { track } = req.body; // { title, url, duration, thumbnail }
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });
    
    playlist.tracks.push(track);
    await playlist.save();
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove a track from a playlist
router.delete('/:id/tracks/:trackIndex', eitherAuth, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });
    
    playlist.tracks.splice(req.params.trackIndex, 1);
    await playlist.save();
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

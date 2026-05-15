import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMusicalNote, HiPlay, HiPause, HiForward, HiStop, HiSpeakerWave, HiQueueList, HiBookmark, HiPlus, HiTrash, HiDocumentPlus, HiXMark } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import socket from '../../utils/socket.js';
import toast from 'react-hot-toast';

export default function MusicPanel() {
  const { guildId } = useParams();
  const { user } = useAuth();
  const [queue, setQueue] = useState({ tracks: [], currentIndex: 0, isPlaying: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(false);

  // Playlist State
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'playlists'
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [trackUrlInput, setTrackUrlInput] = useState('');

  useEffect(() => {
    fetchQueue();
    fetchPlaylists();
    socket.on('queue-update', (data) => {
      if (data.guildId === guildId) {
        setQueue({ tracks: data.tracks, currentIndex: data.currentIndex, isPlaying: data.isPlaying });
      }
    });
    socket.on('playlist-updated', (data) => {
      if (data.guildId === guildId) {
        fetchPlaylists();
        toast.success('Track successfully resolved and added!');
      }
    });
    return () => {
      socket.off('queue-update');
      socket.off('playlist-updated');
    };
  }, [guildId]);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get(`/api/playlists?guildId=${guildId}`);
      if (res.data.playlists) setPlaylists(res.data.playlists);
    } catch {}
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const res = await api.post('/api/playlists', { guildId, name: newPlaylistName });
      setPlaylists([...playlists, res.data.playlist]);
      setNewPlaylistName('');
      toast.success('Playlist Created');
    } catch {}
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await api.delete(`/api/playlists/${playlistId}`);
      setPlaylists(playlists.filter(p => p._id !== playlistId));
      toast.success('Playlist Deleted');
    } catch {}
  };

  const handleAddToPlaylist = async (playlistId) => {
    const currentTrack = queue.tracks?.[queue.currentIndex];
    if (!currentTrack) return toast.error('No track currently playing');
    try {
      await api.post(`/api/playlists/${playlistId}/tracks`, { track: currentTrack });
      fetchPlaylists();
      toast.success('Added to playlist');
    } catch {}
  };

  const handleRemoveTrack = async (playlistId, trackIndex) => {
    try {
      await api.delete(`/api/playlists/${playlistId}/tracks/${trackIndex}`);
      fetchPlaylists();
      toast.success('Track removed from playlist');
    } catch {}
  };

  const handleAddUrlToPlaylist = async (playlistId) => {
    if (!trackUrlInput.trim()) return;
    toast.success('Resolving track link via secure backend...');
    await sendControl('addToPlaylist', { playlistId, query: trackUrlInput });
    setTrackUrlInput('');
  };

  const handlePlayPlaylist = async (playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return toast.error('Playlist is empty');
    setLoading(true);
    await sendControl('play', { tracks: playlist.tracks, userId: user?.discordId });
    setLoading(false);
  };

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/api/music/queue/${guildId}`);
      if (res.data.queue) setQueue(res.data.queue);
    } catch {}
  };

  const sendControl = async (action, data = {}) => {
    try {
      await api.post('/api/music/control', { guildId, action, data });
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} command sent`);
    } catch {
      toast.error('Failed to send command');
    }
  };

  const handlePlay = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    await sendControl('play', { query: searchQuery, userId: user?.discordId });
    setSearchQuery('');
    setLoading(false);
  };

  const currentTrack = queue.tracks?.[queue.currentIndex];

  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <HiMusicalNote className="text-purple-500" />
          Music Studio
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">Audio Engine</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Latency: 12ms</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Player & Search */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          {/* Main Player */}
          <motion.div
            className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              {currentTrack ? (
                <>
                  <div className="relative shrink-0">
                    <motion.div 
                      className="absolute inset-0 bg-purple-500/5 rounded-full"
                      animate={queue.isPlaying ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    {currentTrack.thumbnail ? (
                      <motion.img
                        src={currentTrack.thumbnail}
                        className="w-48 h-48 rounded-xl object-cover shadow-2xl relative z-10 border border-white/10"
                        alt=""
                        animate={queue.isPlaying ? { rotate: [0, 2, 0, -2, 0] } : {}}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-xl bg-white/5 flex items-center justify-center relative z-10 border border-white/10">
                        <HiMusicalNote className="text-5xl text-gray-700" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="mb-6">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-500 mb-2 block">Currently Broadcasting</span>
                      <h3 className="text-2xl font-black text-white leading-tight mb-2">{currentTrack.title}</h3>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                        {currentTrack.duration} <span className="mx-2 opacity-30">|</span> Requested by {currentTrack.requestedBy}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-2 mb-8">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          className="h-full bg-purple-600 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: queue.isPlaying ? '100%' : '45%' }}
                          transition={{ duration: 180, ease: 'linear' }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                        <span>0:00</span>
                        <span>{currentTrack.duration}</span>
                      </div>
                    </div>

                    {/* Studio Controls */}
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <motion.button
                        onClick={() => sendControl('stop')}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <HiStop className="text-xl" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => sendControl(queue.isPlaying ? 'pause' : 'resume')}
                        className="w-16 h-16 flex items-center justify-center rounded-xl bg-purple-600 text-white border border-purple-500 cursor-pointer shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {queue.isPlaying ? <HiPause className="text-3xl" /> : <HiPlay className="text-3xl" />}
                      </motion.button>

                      <motion.button
                        onClick={() => sendControl('skip')}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <HiForward className="text-xl" />
                      </motion.button>

                      <div className="ml-4 flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl flex-1 max-w-[140px]">
                        <HiSpeakerWave className="text-gray-600 text-sm" />
                        <input
                          type="range" min="0" max="100" value={volume}
                          onChange={(e) => { setVolume(e.target.value); sendControl('volume', { volume: parseInt(e.target.value) }); }}
                          className="w-full h-1 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-20 opacity-30 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
                    <HiMusicalNote className="text-4xl text-gray-600" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Studio Idle</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Awaiting your selection</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Precision Search */}
          <motion.div 
            className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-6">Add New Signal</h2>
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                placeholder="Search tracks or paste URL..."
                className="w-full sm:flex-1 h-14 bg-[#0b0c10]/60 border border-white/10 rounded-xl px-5 text-[13px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/70 focus:bg-[#0b0c10] transition-all shadow-inner"
              />
              <button
                onClick={handlePlay}
                disabled={loading || !searchQuery.trim()}
                className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-2 rounded-xl bg-purple-600 border border-purple-500 text-white text-[12px] font-black uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:bg-purple-500 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
              >
                {loading ? 'Processing...' : 'Stream Track'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Queue */}
        <motion.div 
          className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 flex flex-col h-[460px] sticky top-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Stream Queue
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{queue.tracks?.length || 0} Tracks</span>
              {queue.tracks?.length > 1 && (
                <button 
                  onClick={() => sendControl('clear')}
                  className="text-[9px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded transition-all cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
            {queue.tracks?.length > 0 ? (
              queue.tracks.map((track, i) => (
                <motion.div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all group ${
                    i === queue.currentIndex 
                      ? 'bg-purple-500/10 border border-purple-500/20' 
                      : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                  }`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black shrink-0 ${
                    i === queue.currentIndex ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-gray-600'
                  }`}>
                    {i === queue.currentIndex ? <HiPlay /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold truncate uppercase tracking-wide ${i === queue.currentIndex ? 'text-white' : 'text-gray-400'}`}>
                      {track.title}
                    </p>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-0.5">{track.duration}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-10">
                <HiQueueList className="text-5xl mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Queue Vacuum</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Playlists Section */}
      <motion.div 
        className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
            <HiBookmark className="text-purple-500 text-2xl" />
            Saved Playlists Studio
          </h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="text" 
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="Name your new playlist..."
              className="w-full md:w-80 h-12 bg-[#0b0c10]/60 border border-white/10 rounded-xl px-5 text-[13px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/70 focus:bg-[#0b0c10] transition-all shadow-inner"
            />
            <button 
              onClick={handleCreatePlaylist}
              className="h-12 px-6 flex items-center justify-center gap-2 bg-purple-600 border border-purple-500 text-white rounded-xl transition-all hover:bg-purple-500 cursor-pointer text-[12px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <HiPlus className="text-lg" /> Create
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {playlists.length > 0 ? (
            playlists.map(p => (
              <div key={p._id} className="bg-white/[0.02] border border-white/5 p-5 rounded-xl group hover:border-white/10 transition-colors flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="cursor-pointer flex-1 min-w-0"
                    onClick={() => setExpandedPlaylist(expandedPlaylist === p._id ? null : p._id)}
                  >
                    <p className="text-[15px] font-bold text-white uppercase tracking-wide truncate">{p.name}</p>
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest mt-1">{p.tracks?.length || 0} Tracks</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setExpandedPlaylist(expandedPlaylist === p._id ? null : p._id)} title="Add Track from Link" className="w-8 h-8 flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors cursor-pointer">
                      <HiPlus />
                    </button>
                    <button onClick={() => handlePlayPlaylist(p)} title="Play Playlist" className="w-8 h-8 flex items-center justify-center bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-colors cursor-pointer">
                      <HiPlay />
                    </button>
                    <button onClick={() => handleAddToPlaylist(p._id)} title="Add Current Playing Song" className="w-8 h-8 flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors cursor-pointer">
                      <HiDocumentPlus />
                    </button>
                    <button onClick={() => handleDeletePlaylist(p._id)} title="Delete Playlist" className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                      <HiTrash />
                    </button>
                  </div>
                </div>

                {/* Modal handles expanded playlist now */}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 opacity-30">
              <HiBookmark className="text-5xl mx-auto mb-4" />
              <p className="text-[12px] font-black uppercase tracking-widest">No Saved Playlists</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Playlist Modal Popup */}
      {expandedPlaylist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  {playlists.find(p => p._id === expandedPlaylist)?.name}
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Playlist Management</p>
              </div>
              <button 
                onClick={() => setExpandedPlaylist(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <HiXMark className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6 flex-1 overflow-hidden">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <input 
                  type="text" 
                  value={trackUrlInput}
                  onChange={e => setTrackUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrlToPlaylist(expandedPlaylist)}
                  placeholder="Paste YouTube or Spotify Link here..."
                  className="w-full sm:flex-1 h-14 bg-black/50 border border-white/10 rounded-xl px-5 text-[13px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all shadow-inner"
                />
                <button 
                  onClick={() => handleAddUrlToPlaylist(expandedPlaylist)}
                  className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-2 bg-purple-600 border border-purple-500 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all cursor-pointer shadow-lg hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
                >
                  <HiPlus className="text-lg" /> Add Link
                </button>
              </div>
              
              <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1 border border-white/5 rounded-xl bg-black/20 p-2">
                {(() => {
                  const p = playlists.find(p => p._id === expandedPlaylist);
                  return p?.tracks?.length > 0 ? p.tracks.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] group/track hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/10">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <HiMusicalNote className="text-gray-500 text-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white truncate">{t.title}</p>
                        <p className="text-[10px] font-black text-gray-500 mt-1">{t.duration}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveTrack(p._id, idx)}
                        className="opacity-0 group-hover/track:opacity-100 p-2.5 text-red-500 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-500/30"
                        title="Remove Track"
                      >
                        <HiXMark className="text-lg" />
                      </button>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                      <HiBookmark className="text-5xl mb-4" />
                      <p className="text-[12px] font-black uppercase tracking-widest">Playlist is empty</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

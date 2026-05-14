import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMusicalNote, HiChatBubbleLeftRight, HiShieldCheck, HiCommandLine, HiSignal, HiClock } from 'react-icons/hi2';
import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

const statCards = [
  { icon: HiMusicalNote, label: 'Music Studio', key: 'musicTracks', color: '#5865F2', glow: 'rgba(88,101,242,0.15)' },
  { icon: HiChatBubbleLeftRight, label: 'Intelligence Rules', key: 'keywords', color: '#00d4ff', glow: 'rgba(0,212,255,0.15)' },
  { icon: HiShieldCheck, label: 'Security HQ', key: 'roles', color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  { icon: HiCommandLine, label: 'Total Operations', key: 'commands', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
];

export default function Overview() {
  const { guildId } = useParams();
  const [stats, setStats] = useState({ musicTracks: 0, keywords: 0, roles: 0, commands: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [botStatus, setBotStatus] = useState('online');
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Fetch initial queue
    api.get(`/api/music/queue/${guildId}`).then(res => {
      if (res.data.queue?.tracks?.length > 0) {
        setCurrentSong(res.data.queue.tracks[res.data.queue.currentIndex]);
      }
    }).catch(() => {});

    // Listen for queue updates
    socket.on('queue-update', (data) => {
      if (data.guildId === guildId) {
        setCurrentSong(data.tracks[data.currentIndex] || null);
      }
    });

    return () => socket.off('queue-update');
  }, [guildId]);

  const fetchData = async () => {
    try {
      const [keywordsRes, rolesRes, logsRes] = await Promise.all([
        api.get(`/api/keywords?guildId=${guildId}`).catch(() => ({ data: { keywords: [] } })),
        api.get(`/api/roles?guildId=${guildId}`).catch(() => ({ data: { rules: [] } })),
        api.get(`/api/logs?guildId=${guildId}&limit=10`).catch(() => ({ data: { logs: [] } })),
      ]);
      setStats({
        musicTracks: 0,
        keywords: keywordsRes.data.keywords?.length || 0,
        roles: rolesRes.data.rules?.length || 0,
        commands: logsRes.data.logs?.filter(l => l.type === 'command')?.length || 0,
      });
      setRecentLogs(logsRes.data.logs || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Cinematic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-discord/40" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-discord">Command Center</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-white uppercase">Operational <span className="text-discord">Overview</span></h1>
        <p className="text-gray-500 text-sm font-medium tracking-wide">Synthesizing real-time data from sector: <span className="text-gray-300 font-bold">{guildId}</span></p>
      </motion.div>

      {/* Stats Grid - Premium Floating Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10" 
        variants={container} 
        initial="hidden" 
        animate="show"
      >
        {statCards.map((card) => (
          <motion.div 
            key={card.key} 
            variants={item} 
            whileHover={{ y: -12, scale: 1.02 }} 
            className="bg-[#0b0c10]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-8 transition-all duration-500 relative overflow-hidden group shadow-2xl hover:border-white/10"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                 style={{ background: `radial-gradient(circle at top right, ${card.glow} 0%, transparent 70%)` }} />
            
            <div className="flex items-center justify-between mb-10">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 group-hover:bg-discord transition-all duration-500 shadow-inner">
                <card.icon className="text-2xl text-discord group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">Sync_Ready</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                {loading ? (
                  <div className="h-10 w-16 bg-white/5 animate-pulse rounded-lg" />
                ) : stats[card.key]}
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-500 group-hover:text-discord transition-colors">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Primary Detail Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Live Activity Forensics */}
        <motion.div 
          className="lg:col-span-2 bg-[#0b0c10]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-10 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-discord/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col gap-1">
              <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                <HiClock className="text-discord text-xl" />
                Activity Forensics
              </h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Real-time signal monitoring</p>
            </div>
            <button className="px-5 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-discord transition-all cursor-pointer">Export Logs</button>
          </div>
          
          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-10">
                <HiSignal className="text-6xl mb-4" />
                <p className="text-[12px] font-black uppercase tracking-[0.4em]">Awaiting Data Stream</p>
              </div>
            ) : (
              recentLogs.map((log, i) => (
                <motion.div
                  key={log._id || i}
                  className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all group relative overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    log.type === 'music' ? 'bg-purple-500' :
                    log.type === 'keyword' ? 'bg-cyan-500' :
                    log.type === 'role' ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="flex flex-col gap-1">
                      <p className="text-[13px] font-bold text-white truncate uppercase tracking-wide group-hover:text-discord transition-colors">{log.action}</p>
                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Operator: {log.username || 'System'}</p>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 tabular-nums bg-black/20 px-3 py-1 rounded-lg">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Tactical Status Sector */}
        <motion.div 
          className="lg:col-span-1 bg-[#0b0c10]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-10 shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-white mb-12 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-discord animate-pulse" />
            Tactical Status
          </h2>
          <div className="flex flex-col gap-6">
            {[
              { label: 'Uplink Integrity', value: botStatus === 'online' ? '100%' : 'OFFLINE', color: botStatus === 'online' ? 'text-green-500' : 'text-red-500' },
              { label: 'Latency Pulse', value: '24ms', color: 'text-discord' },
              { label: 'Memory Deck', value: '1.2GB', color: 'text-gray-500' },
              { label: 'Active Streams', value: '04', color: 'text-discord' }
            ].map((stat, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{stat.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1.5, delay: 0.8 + (i * 0.1) }}
                    className={`h-full bg-current ${stat.color.replace('text-', 'bg-')}`} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-2xl bg-[#0b0c10] border border-white/5 relative overflow-hidden group">
            {currentSong ? (
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative shrink-0">
                   <div className="absolute inset-0 bg-discord/20 rounded-full animate-pulse" />
                   {currentSong.thumbnail ? (
                     <img src={currentSong.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover relative z-10" />
                   ) : (
                     <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center relative z-10">
                       <HiMusicalNote className="text-gray-500" />
                     </div>
                   )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-discord mb-1">Now Broadcasting</p>
                  <p className="text-xs font-bold text-white truncate">{currentSong.title}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{currentSong.duration}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <HiMusicalNote className="text-2xl text-gray-700 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Studio Idle</p>
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Awaiting Audio Stream</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

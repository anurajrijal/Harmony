import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { HiServerStack, HiUsers, HiArrowRightOnRectangle, HiPlusCircle, HiShieldCheck, HiCommandLine, HiArrowPath } from 'react-icons/hi2';
import { FaDiscord } from 'react-icons/fa';
import api from '../utils/api.js';

export default function ServerSelect() {
  const { user, logout } = useAuth();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    try {
      const res = await api.get('/api/guilds');
      console.log('📡 Guilds retrieved:', res.data.guilds?.length || 0);
      setGuilds(res.data.guilds || []);
    } catch (err) {
      console.error('❌ Failed to fetch guilds:', err.message);
      setGuilds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = () => {
    window.open(INVITE_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-discord/30 flex flex-col items-center p-6 md:p-12 font-sans relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-discord/5 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <motion.div 
        className="w-full max-w-6xl relative z-10 flex flex-col items-center pt-12 md:pt-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Navigation Deck */}
        <div className="w-full flex items-center justify-between mb-24 px-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ y: -2, backgroundColor: 'rgba(88, 101, 242, 0.1)', borderColor: 'rgba(88, 101, 242, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchGuilds()}
              className="flex items-center gap-3 px-8 py-4 bg-white/[0.02] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-discord transition-all cursor-pointer group shadow-lg"
            >
              <HiArrowPath className={`text-lg group-active:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
              SYNC_SYSTEM_NODES
            </motion.button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl px-6 py-3 shadow-2xl">
              <div className="text-right hidden sm:block">
                <p className="text-white font-black text-[11px] uppercase tracking-widest">{user?.username}</p>
                <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.4em] mt-0.5">Clearance: Level_1</p>
              </div>
              {user?.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`}
                  className="w-10 h-10 rounded-xl border border-white/10 shadow-xl"
                  alt=""
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-discord to-purple-600 flex items-center justify-center text-sm font-black border border-white/10">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ y: -2, backgroundColor: '#ef444415', borderColor: '#ef444430', color: '#ef4444' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { logout(); navigate('/login'); }}
              className="w-14 h-14 flex items-center justify-center bg-white/[0.02] border border-white/10 rounded-xl text-gray-600 transition-all cursor-pointer shadow-lg"
            >
              <HiArrowRightOnRectangle className="text-2xl" />
            </motion.button>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-24 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 bg-discord/5 border border-discord/10 rounded-full mb-8"
          >
            <div className="w-1.5 h-1.5 bg-discord rounded-full shadow-[0_0_8px_rgba(88,101,242,0.8)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-discord">Server_Selection_Interface</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight">
            SELECT YOUR <span className="text-white">KINGDOM</span>
          </h1>
          
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-md mx-auto opacity-60">
            Initialize dashboard uplink to manage community protocols.
          </p>
        </div>

        {/* The Portal Grid */}
        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-white/[0.02] rounded-xl animate-pulse border border-white/5 shadow-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
              <AnimatePresence>
                {guilds.map((guild, index) => (
                  <motion.div
                    key={guild.guildId}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                    whileHover={{ y: -16 }}
                    className="w-full aspect-square bg-[#0b0c10]/40 backdrop-blur-xl border border-white/10 hover:border-discord/40 rounded-xl p-10 cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center transition-all duration-500 shadow-2xl"
                    onClick={() => navigate(`/dashboard/${guild.guildId}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-discord/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-discord/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                    
                    <div className="relative mb-10">
                      {guild.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.icon}.png?size=256`}
                          className="w-24 h-24 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500 border border-white/5"
                          alt=""
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-tr from-[#1a1d23] to-[#0b0c10] flex items-center justify-center text-4xl font-black shadow-2xl border border-white/5 group-hover:border-discord/20 transition-all">
                          {guild.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-3 -right-3 bg-[#050608] border border-white/10 p-2 rounded-xl shadow-xl group-hover:bg-discord group-hover:border-discord transition-all">
                        <HiShieldCheck className="text-gray-500 group-hover:text-white text-base" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-white text-center mb-3 uppercase tracking-tight group-hover:text-discord transition-colors">
                      {guild.name}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-gray-600 font-black text-[9px] uppercase tracking-[0.3em] mb-10 group-hover:text-gray-400 transition-colors">
                      <div className="w-1 h-1 bg-discord rounded-full" />
                      {guild.memberCount || '0'} Population
                    </div>

                    <div className="w-full py-4 bg-discord text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-xl border border-white/20 transition-all text-center shadow-xl group-hover:shadow-discord/40 group-hover:brightness-110 group-hover:-translate-y-1">
                      MANAGE_SERVER_CORE
                    </div>
                  </motion.div>
                ))}

                {/* The "Invite" Card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: guilds.length * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                  whileHover={{ y: -16 }}
                  onClick={handleInvite}
                  className="w-full aspect-square bg-transparent border-2 border-dashed border-white/5 hover:border-discord/20 rounded-xl p-10 cursor-pointer group flex flex-col items-center justify-center text-center transition-all duration-500"
                >
                  <div className="w-20 h-20 rounded-xl bg-white/[0.02] flex items-center justify-center mb-8 group-hover:bg-discord/10 transition-all border border-white/5 group-hover:border-discord/20 group-hover:rotate-12">
                    <HiPlusCircle className="text-4xl text-gray-800 group-hover:text-discord transition-colors" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">Deploy Harmony</h3>
                  <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em] px-8 leading-relaxed mb-10">
                    Initialize bot uplink for a new community portal.
                  </p>
                  <div className="w-full py-4 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.4em] transition-all border border-white/20 text-center shadow-xl group-hover:bg-discord group-hover:text-white group-hover:-translate-y-1">
                    DEPLOY_NEW_NODE
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Global Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32 pb-12 flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-4 text-gray-800 font-black text-[8px] uppercase tracking-[0.6em]">
            <span className="w-12 h-[1px] bg-white/[0.03]" />
            Harmony_Platform_v2.4
            <span className="w-12 h-[1px] bg-white/[0.03]" />
          </div>
          <div className="flex gap-8 text-[8px] font-black text-gray-700 uppercase tracking-widest">
            <span className="hover:text-discord cursor-pointer transition-colors">Core_Engine</span>
            <span className="hover:text-discord cursor-pointer transition-colors">Forensics</span>
            <span className="hover:text-discord cursor-pointer transition-colors">Intelligence</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}



import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaDiscord } from 'react-icons/fa';
import { HiMusicalNote, HiChatBubbleLeftRight, HiShieldCheck, HiChartBar } from 'react-icons/hi2';

const features = [
  { icon: HiMusicalNote, title: 'Music Player', desc: 'Full queue-based music with YouTube support', color: '#a855f7' },
  { icon: HiChatBubbleLeftRight, title: 'Auto Replies', desc: 'Keyword triggers with regex & embed support', color: '#00d4ff' },
  { icon: HiShieldCheck, title: 'Role Automation', desc: 'Auto-roles, reaction roles & action-based', color: '#10b981' },
  { icon: HiChartBar, title: 'Live Analytics', desc: 'Real-time logs and bot activity monitoring', color: '#f59e0b' },
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/servers');
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://harmony-backend-t72j.onrender.com');
    window.location.href = `${baseURL}/auth/discord`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050608] overflow-hidden font-sans">
      {/* Left Side: Brand & Features */}
      <div className="w-full md:w-[60%] p-8 md:p-24 flex flex-col justify-center items-start relative z-10 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-discord/20 blur-[180px] rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-60 -right-40 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 flex flex-col items-start"
        >
          <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-10"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-discord to-purple-600 rounded-xl flex items-center justify-center shadow-2xl shadow-discord/30 border border-white/10">
              <FaDiscord className="text-5xl text-white" />
            </div>
          </motion.div>

          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[2px] bg-discord rounded-full" />
            <h2 className="text-discord font-black text-[11px] uppercase tracking-[0.5em]">Harmony Core Engine</h2>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.9]">
            The New Era of <br />
            <span className="text-white">Management.</span>
          </h1>
          
          <p className="text-lg text-gray-500 mb-20 max-w-xl font-bold uppercase tracking-widest leading-relaxed opacity-80">
            High-performance Discord infrastructure for elite communities.
          </p>

          <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full max-w-4xl">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                className="group flex items-start gap-6"
              >
                <div 
                  className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5 group-hover:bg-discord group-hover:border-discord transition-all duration-500"
                  style={{ color: feature.color }}
                >
                  <feature.icon className="text-2xl group-hover:text-white transition-colors" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] group-hover:text-discord transition-colors">{feature.title} PROTOCOL</h3>
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[180px]">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Card */}
      <div className="w-full md:w-[40%] p-6 md:p-24 flex items-center justify-center relative bg-white/[0.01]">
        <div className="absolute inset-0 bg-[#0b0c10]/80 backdrop-blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 w-full max-w-[440px]"
        >
          <div className="bg-[#050608] border border-white/5 rounded-xl p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-discord/5 blur-3xl rounded-full" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight uppercase">System Access</h2>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-12">Security Level: Administrative</p>

              <div className="space-y-12">
                <motion.button
                  whileHover={{ scale: 1.02, y: -4, shadow: "0 20px 40px rgba(88, 101, 242, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  className="w-full py-6 bg-white text-black hover:bg-discord hover:text-white rounded-xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 border border-white/10 transition-all cursor-pointer group shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
                >
                  <FaDiscord className="text-2xl group-hover:rotate-[15deg] transition-transform duration-300" />
                  INITIATE_UPLINK_PROTOCOL
                </motion.button>

                <div className="flex flex-col items-center gap-10">
                  <div className="flex items-center gap-4 py-3 px-6 bg-green-500/5 rounded-xl border border-green-500/10 shadow-inner">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                    <p className="text-green-500/80 text-[9px] font-black tracking-[0.4em] uppercase">Encrypted Connection</p>
                  </div>
                  
                  <div className="text-center space-y-6 opacity-40 group hover:opacity-80 transition-opacity">
                    <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em]">
                      Passwordless Integration
                    </p>
                    <div className="h-[1px] w-12 bg-white/10 mx-auto" />
                    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest leading-loose max-w-[280px] mx-auto">
                      Access constitutes agreement to <span className="text-gray-300 hover:text-discord cursor-pointer">Service Protocols</span> and <span className="text-gray-300 hover:text-discord cursor-pointer">Privacy Meshes</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Branding Decor */}
          <div className="absolute -bottom-20 -right-20 text-[200px] font-black text-white/[0.01] select-none pointer-events-none uppercase tracking-tighter">
            HMNY
          </div>
        </motion.div>
      </div>

      {/* Shared Animation: Split reveal */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 1.2, ease: [0.8, 0, 0.1, 1] }}
        style={{ originX: 0 }}
        className="fixed inset-0 bg-discord z-[100] pointer-events-none"
      />
    </div>
  );
}


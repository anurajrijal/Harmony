import { useState, useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import socket, { connectSocket, joinGuild, leaveGuild } from '../utils/socket.js';
import {
  HiHome, HiMusicalNote, HiChatBubbleLeftRight, HiShieldCheck,
  HiDocumentText, HiCog6Tooth, HiArrowLeft, HiPower, HiCommandLine
} from 'react-icons/hi2';
import { FaDiscord } from 'react-icons/fa';

const navItems = [
  { path: '', icon: HiHome, label: 'Overview', end: true },
  { path: 'music', icon: HiMusicalNote, label: 'Music Studio' },
  { path: 'keywords', icon: HiChatBubbleLeftRight, label: 'Intelligence Hub' },
  { path: 'roles', icon: HiShieldCheck, label: 'Security HQ' },
  { path: 'greetings', icon: HiDocumentText, label: 'Greetings' },
  { path: 'commands', icon: HiCommandLine, label: 'Command Directory' },
  { path: 'logs', icon: HiDocumentText, label: 'Activity Logs' },
  { path: 'settings', icon: HiCog6Tooth, label: 'System Config' },
];

export default function DashboardLayout() {
  const { guildId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [botStatus, setBotStatus] = useState('online');

  useEffect(() => {
    connectSocket();
    joinGuild(guildId);
    socket.on('bot-status', (data) => setBotStatus(data.status));
    return () => {
      leaveGuild(guildId);
      socket.off('bot-status');
    };
  }, [guildId]);

  return (
    <div className="min-h-screen bg-[#050608] text-white flex font-sans selection:bg-discord/30 relative overflow-hidden">
      {/* Cinematic Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-discord/5 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Slim-Tactical Sidebar */}
      <aside className="hidden lg:flex h-screen w-24 flex-col justify-between border-r border-white/5 bg-white/[0.01] backdrop-blur-[2px] relative z-40 transition-all duration-300">
        <div>
          {/* Top Logo / Bot Icon */}
          <div className="inline-flex size-24 items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              onClick={() => navigate('/servers')}
              className="grid size-12 place-content-center rounded-xl bg-white/[0.03] border border-white/10 text-discord shadow-2xl cursor-pointer group relative"
            >
              <FaDiscord className="text-2xl" />
              <span className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-lg bg-gray-900 border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white group-hover:visible whitespace-nowrap z-50">
                Back to Portal
              </span>
            </motion.div>
          </div>

          <div className="border-t border-white/5">
            <div className="px-3">
              <nav className="flex flex-col gap-6 py-10 items-center">
                {navItems.map((item) => {
                  const isActive = location.pathname.endsWith(item.path === '' ? guildId : item.path);
                  return (
                    <NavLink
                      key={item.label}
                      to={`/dashboard/${guildId}/${item.path}`}
                      end={item.end}
                      className={`
                        group relative flex justify-center rounded-xl p-4 transition-all no-underline
                        ${isActive ? 'bg-discord/20 text-discord border border-discord/30' : 'text-gray-500 hover:bg-white/[0.03] hover:text-white'}
                      `}
                    >
                      <item.icon className="text-3xl shrink-0" />

                      <span className="invisible absolute start-full top-1/2 ms-6 -translate-y-1/2 rounded-lg bg-gray-900 border border-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white group-hover:visible whitespace-nowrap shadow-2xl z-50">
                        {item.label}
                        {isActive && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-t border-white/10 rotate-45" />}
                      </span>

                      {/* Liquid Active Line */}
                      {isActive && (
                        <motion.div 
                          layoutId="active-line"
                          className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-discord rounded-full shadow-[0_0_15px_rgba(88,101,242,1)]"
                        />
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section - Logout */}
        <div className="sticky inset-x-0 bottom-0 border-t border-white/5 bg-[#050608]/40 p-4">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="group relative flex w-full justify-center rounded-xl px-4 py-4 text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer border border-transparent hover:border-red-500/20"
          >
            <HiPower className="text-2xl" />
            <span className="invisible absolute start-full top-1/2 ms-6 -translate-y-1/2 rounded-lg bg-red-900 border border-red-500/30 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white group-hover:visible whitespace-nowrap z-50">
              Initiate Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Precision Top Header */}
        <header className="h-20 flex items-center justify-between px-10 bg-[#050608]/40 backdrop-blur-xl border-b border-white/5">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-discord mb-0.5">
              Sector / {navItems.find(n => location.pathname.includes(n.path) && n.path !== '')?.label || 'Core Overview'}
            </h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Harmony Core v1.2</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 px-5 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-white font-black text-[10px] uppercase tracking-wider">{user?.username}</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Administrator</p>
              </div>
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`}
                    className="w-9 h-9 rounded-lg border border-white/10 shadow-2xl"
                    alt=""
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-discord flex items-center justify-center text-xs font-black text-white shadow-2xl">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#050608] rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <main className="flex-1 overflow-y-auto p-10 lg:p-16 lg:pl-28 custom-scrollbar scroll-smooth">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

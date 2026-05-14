import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiCommandLine, HiMusicalNote, HiShieldCheck, 
  HiQuestionMarkCircle, HiChevronRight, HiXMark, 
  HiUserPlus, HiCursorArrowRays, HiMagnifyingGlassCircle
} from 'react-icons/hi2';

const categories = [
  { 
    id: 'music', 
    name: 'Music Studio', 
    icon: HiMusicalNote, 
    color: '#5865F2',
    desc: 'High-fidelity audio control for your voice channels.',
    commands: [
      { name: '/play', desc: 'Play any song from YouTube or a direct URL', usage: '/play [query/url]' },
      { name: '/skip', desc: 'Skip the currently playing track', usage: '/skip' },
      { name: '/stop', desc: 'Stop the music and clear the entire queue', usage: '/stop' },
      { name: '/pause', desc: 'Pause the current playback', usage: '/pause' },
      { name: '/resume', desc: 'Resume the paused playback', usage: '/resume' },
      { name: '/queue', desc: 'Show all upcoming songs in the queue', usage: '/queue' },
      { name: '/volume', desc: 'Adjust the volume level (0-100)', usage: '/volume [0-100]' },
    ]
  },
  { 
    id: 'intelligence', 
    name: 'Intelligence Hub', 
    icon: HiMagnifyingGlassCircle, 
    color: '#00d4ff',
    desc: 'Keyword triggers and automated response logic.',
    commands: [
      { name: 'Word Triggers', desc: 'Bot responds when specific keywords are detected', usage: 'Configured in Intelligence Hub' },
      { name: 'Regex Support', desc: 'Advanced pattern matching for triggers', usage: 'Use regex in keyword config' },
      { name: 'Embed Replies', desc: 'Rich responses with images and links', usage: 'Configured in Intelligence Hub' },
    ]
  },
  { 
    id: 'security', 
    name: 'Security Headquarters', 
    icon: HiShieldCheck, 
    color: '#10b981',
    desc: 'Automated role assignment and membership logic.',
    commands: [
      { name: '/roles', desc: 'View current role automation status', usage: '/roles' },
      { name: 'Join Protocol', desc: 'Auto-assign roles to new members', usage: 'Configured in Security HQ' },
      { name: 'Reaction Mesh', desc: 'Assign roles via message reactions', usage: 'Configured in Security HQ' },
    ]
  }
];

export default function CommandsGuide() {
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <div className="w-full flex flex-col font-sans">
      <motion.div 
        className="w-full relative z-10 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Hero Section */}
        <div className="mb-16">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-discord/10 border border-discord/20 rounded-full mb-6"
          >
            <HiQuestionMarkCircle className="text-discord" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-discord">Knowledge Base</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter uppercase">Command Directory</h1>
          <p className="text-gray-500 text-sm font-medium max-w-xl leading-relaxed">
            Forensic breakdown of all Harmony Core protocols. Use these commands in your server to interact with the bot's intelligence.
          </p>
        </div>

        {/* Interactive Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full mb-32 mt-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, shadow: `0 20px 40px ${cat.color}20` }}
              onClick={() => setActiveCategory(cat)}
              className="bg-[#0f1115]/60 backdrop-blur-xl border border-white/5 rounded-xl p-8 cursor-pointer group hover:border-white/10 transition-all relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-lg bg-white/[0.03] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-discord transition-all duration-500">
                <cat.icon className="text-2xl text-discord group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-black mb-3 text-white tracking-tight uppercase">{cat.name}</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed mb-8">{cat.desc}</p>
              <div className="flex items-center gap-2 text-discord font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                Access Commands <HiChevronRight />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technical Integrations Section */}
        <section className="w-full mb-12">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <HiShieldCheck className="text-green-500" />
              Integration Protocols
            </h2>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div className="bg-[#0f1115]/40 border border-white/5 rounded-xl p-10 hover:border-blue-500/20 transition-colors group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <HiUserPlus className="text-2xl" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight">Join Deployment</h4>
              </div>
              <p className="text-gray-500 text-xs font-medium leading-relaxed mb-8">
                Automatically synchronize new members with pre-defined security roles upon arrival.
              </p>
              <ul className="space-y-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                <li className="flex items-center gap-3"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Zero user action</li>
                <li className="flex items-center gap-3"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Instant role provisioning</li>
              </ul>
            </div>

            <div className="bg-[#0f1115]/40 border border-white/5 rounded-xl p-10 hover:border-purple-500/20 transition-colors group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <HiCursorArrowRays className="text-2xl" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight">Reaction Mesh</h4>
              </div>
              <p className="text-gray-500 text-xs font-medium leading-relaxed mb-8">
                Interactive self-selection protocol. Users claim roles by interacting with specific emoji arrays.
              </p>
              <ul className="space-y-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                <li className="flex items-center gap-3"><div className="w-1 h-1 bg-purple-500 rounded-full" /> Command-free selection</li>
                <li className="flex items-center gap-3"><div className="w-1 h-1 bg-purple-500 rounded-full" /> Visual self-identification</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Command Detail Popup (Modal) */}
        <AnimatePresence>
          {activeCategory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveCategory(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-3xl bg-[#050608] border border-white/10 rounded-2xl p-10 relative z-10 overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/10">
                      <activeCategory.icon className="text-3xl text-discord" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight">{activeCategory.name}</h2>
                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Operational Manual</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveCategory(null)} 
                    className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all border border-white/10 cursor-pointer"
                  >
                    <HiXMark className="text-2xl" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  {activeCategory.commands.map((cmd, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/[0.04] hover:border-discord/20 transition-all"
                    >
                      <div className="space-y-1">
                        <span className="text-base font-black text-white group-hover:text-discord transition-colors">{cmd.name}</span>
                        <p className="text-xs text-gray-500 font-medium">{cmd.desc}</p>
                      </div>
                      <div className="bg-black/40 border border-white/10 px-5 py-3 rounded-xl font-mono text-[11px] text-discord shadow-inner">
                        {cmd.usage}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">
                    Harmony_Core_Intelligence
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-discord">
                    v2.4_Stable
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

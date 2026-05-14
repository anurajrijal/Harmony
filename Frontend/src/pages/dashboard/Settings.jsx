import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiCog6Tooth, HiAdjustmentsHorizontal, HiOutlineMusicalNote, HiShieldCheck } from 'react-icons/hi2';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';

export default function Settings() {
  const { guildId } = useParams();
  const [settings, setSettings] = useState({
    prefix: '!', musicEnabled: true, autoReplyEnabled: true, roleAutomationEnabled: true,
    defaultVolume: 50, maxQueueSize: 100, autoDisconnectTimeout: 300, is247Mode: false,
    welcomeMessage: '', logChannelId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, [guildId]);

  const fetchSettings = async () => {
    try {
      const res = await api.get(`/api/settings/${guildId}`);
      if (res.data.settings) setSettings(res.data.settings);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/settings/${guildId}`, settings);
      toast.success('Settings synchronized');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const ToggleRow = ({ label, description, field }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 transition-all group">
      <div>
        <p className="font-black text-[10px] uppercase tracking-widest text-white mb-1">{label}</p>
        {description && <p className="text-[10px] text-gray-500 font-medium">{description}</p>}
      </div>
      <button 
        onClick={() => setSettings({ ...settings, [field]: !settings[field] })}
        className={`w-10 h-6 rounded-full relative transition-all cursor-pointer border-0 ${settings[field] ? 'bg-discord' : 'bg-gray-800'}`}
      >
        <motion.div 
          animate={{ x: settings[field] ? 18 : 4 }}
          className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" 
        />
      </button>
    </div>
  );

  if (loading) return (
    <div className="space-y-6 max-w-4xl">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse border border-white/5" />
      ))}
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <HiCog6Tooth className="text-gray-500" />
            Mainframe Config
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-discord bg-discord/10 px-2 py-0.5 rounded">Core Logic</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Revision 2.4.0</span>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-discord text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-discord/20 cursor-pointer border border-white/10 disabled:opacity-50"
        >
          {saving ? 'Syncing...' : 'Commit Changes'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {/* General Settings */}
        <div className="space-y-8">
          <section className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 space-y-8">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <HiAdjustmentsHorizontal className="text-discord text-lg" /> 
              General Protocol
            </h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Command Prefix</label>
                <div className="relative">
                  <input 
                    value={settings.prefix} 
                    onChange={e => setSettings({ ...settings, prefix: e.target.value })}
                    maxLength={5}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 text-sm font-black text-discord focus:outline-none focus:border-discord focus:bg-white/[0.04] transition-all" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-700 uppercase tracking-widest">Active</div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Entry Signal Hook</label>
                <textarea 
                  value={settings.welcomeMessage || ''} 
                  onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })} 
                  rows={4}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-6 py-5 text-sm font-medium focus:outline-none focus:border-discord focus:bg-white/[0.04] transition-all resize-none leading-relaxed" 
                  placeholder="Initiate greeting sequence: Welcome {user}..." 
                />
              </div>
            </div>
          </section>

          <section className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 space-y-8">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <HiShieldCheck className="text-green-500 text-lg" /> 
              Module Overrides
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <ToggleRow label="Audio Interface" description="High-fidelity music streaming" field="musicEnabled" />
              <ToggleRow label="Intelligence Core" description="Neural response automations" field="autoReplyEnabled" />
              <ToggleRow label="Security Mesh" description="Automated clearance protocols" field="roleAutomationEnabled" />
              <ToggleRow label="Persistent Uplink" description="Voice channel 24/7 maintenance" field="is247Mode" />
            </div>
          </section>
        </div>

        {/* Music Specifics */}
        <div className="space-y-8">
          <section className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 space-y-10">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <HiOutlineMusicalNote className="text-purple-500 text-lg" /> 
              Audio Calibration
            </h2>
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Default Output Gain</label>
                  <span className="text-[11px] font-black text-purple-500 tabular-nums uppercase tracking-widest">{settings.defaultVolume}% db</span>
                </div>
                <div className="relative h-2 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                     style={{ width: `${settings.defaultVolume}%` }}
                   />
                   <input 
                    type="range" 
                    min="0" max="100" 
                    value={settings.defaultVolume}
                    onChange={e => setSettings({ ...settings, defaultVolume: parseInt(e.target.value) })} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Stack Limit</label>
                  <input 
                    type="number" 
                    value={settings.maxQueueSize} 
                    onChange={e => setSettings({ ...settings, maxQueueSize: parseInt(e.target.value) || 100 })}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 text-sm font-black text-gray-300 focus:outline-none focus:border-purple-500 focus:bg-white/[0.04] transition-all" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Disconnect TTL</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={settings.autoDisconnectTimeout} 
                      onChange={e => setSettings({ ...settings, autoDisconnectTimeout: parseInt(e.target.value) || 300 })}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 text-sm font-black text-gray-300 focus:outline-none focus:border-purple-500 focus:bg-white/[0.04] transition-all" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-700 uppercase tracking-widest">SEC</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="p-8 bg-discord/5 rounded-xl border border-discord/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-discord/5 blur-3xl rounded-full" />
            <h4 className="text-[10px] font-black text-discord uppercase tracking-[0.3em] mb-4 relative z-10 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-discord" /> Technical Advisory
            </h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed relative z-10">
              System prefix conflicts may cause command overlap. High TTL values increase system resource overhead. Calibrate accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

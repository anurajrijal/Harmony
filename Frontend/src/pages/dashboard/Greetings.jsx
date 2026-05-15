import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';


export default function Greetings() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState([]);
  const [config, setConfig] = useState({
    enabled: false,
    welcomeChannelId: '',
    welcomeMessage: 'Welcome to the server, @user!',
    goodbyeChannelId: '',
    goodbyeMessage: '@user has left the server.',
    backgroundImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    textColor: '#FFFFFF',
    useGifMode: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch channels safely
        try {
          const channelsRes = await api.get(`/api/guilds/${guildId}/channels`);
          if (channelsRes.data.success) {
            setChannels(channelsRes.data.channels.filter(c => c.type === 0)); // Text channels
          }
        } catch (err) {
          console.error("Failed to load channels", err);
          toast.error('Failed to load server channels');
        }

        // Fetch greetings safely
        try {
          const configRes = await api.get(`/api/greetings?guildId=${guildId}`);
          if (configRes.data.success && configRes.data.config) {
            setConfig(prev => ({ ...prev, ...configRes.data.config }));
          }
        } catch (err) {
          console.error("Failed to load greetings", err);
          toast.error('Failed to load greetings data (Check if backend is running)');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [guildId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/api/greetings`, { guildId, ...config });
      toast.success('Greetings settings saved!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-20">Loading...</div>;
  }

  const channelOptions = channels.map(c => ({ value: c.id, label: `#${c.name}` }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0D12] p-8 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-discord/10 to-transparent opacity-50" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-4 mb-2">
            <span className="p-3 rounded-2xl bg-discord/20 text-discord border border-discord/30 shadow-[0_0_20px_rgba(88,101,242,0.2)]">👋</span>
            <h1 className="text-4xl font-black tracking-tight text-white">Greetings</h1>
          </div>
          <p className="text-gray-400 font-medium tracking-wide">Design beautiful, custom welcome and goodbye image cards.</p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <label className="flex items-center cursor-pointer gap-3">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Status</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-gray-700'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.enabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3.5 bg-discord text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#4752C4] hover:shadow-[0_0_25px_rgba(88,101,242,0.5)] transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Welcome Settings */}
        <div className="bg-[#0B0D12] p-8 rounded-xl border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50" />
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Event</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Target Channel</label>
              <CustomSelect
                options={channelOptions}
                value={config.welcomeChannelId}
                onChange={(value) => setConfig({ ...config, welcomeChannelId: value || '' })}
                placeholder="Select a channel"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Message Text</label>
              <p className="text-xs text-gray-500 mb-2">Use <code className="bg-gray-800 px-1 py-0.5 rounded text-discord">@user</code> to mention the user.</p>
              <textarea
                value={config.welcomeMessage}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                className="w-full bg-[#050608] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-discord focus:ring-1 focus:ring-discord transition-all shadow-inner h-24 resize-none"
                placeholder="Welcome to the server, @user!"
              />
            </div>
          </div>
        </div>

        {/* Goodbye Settings */}
        <div className="bg-[#0B0D12] p-8 rounded-xl border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
          <h2 className="text-2xl font-bold text-white mb-6">Goodbye Event</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Target Channel</label>
              <CustomSelect
                options={channelOptions}
                value={config.goodbyeChannelId}
                onChange={(value) => setConfig({ ...config, goodbyeChannelId: value || '' })}
                placeholder="Select a channel"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Message Text</label>
              <p className="text-xs text-gray-500 mb-2">Use <code className="bg-gray-800 px-1 py-0.5 rounded text-discord">@user</code> to insert their name.</p>
              <textarea
                value={config.goodbyeMessage}
                onChange={(e) => setConfig({ ...config, goodbyeMessage: e.target.value })}
                className="w-full bg-[#050608] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-discord focus:ring-1 focus:ring-discord transition-all shadow-inner h-24 resize-none"
                placeholder="@user has left the server."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Customization */}
      <div className="bg-[#0B0D12] p-8 rounded-xl border border-white/5 shadow-2xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Card Visuals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Background Image URL</label>
            <input
              type="text"
              value={config.backgroundImage}
              onChange={(e) => setConfig({ ...config, backgroundImage: e.target.value })}
              className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-discord transition-all shadow-inner"
              placeholder="https://example.com/image.png"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Text Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={config.textColor}
                onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                className="flex-1 bg-[#050608] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-discord transition-all shadow-inner"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-discord/5 rounded-2xl border border-discord/10 mt-6">
          <label className="flex items-center cursor-pointer gap-4">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={config.useGifMode} onChange={(e) => setConfig({ ...config, useGifMode: e.target.checked })} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${config.useGifMode ? 'bg-discord' : 'bg-gray-700'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.useGifMode ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-white">Animated GIF Backgrounds</span>
              <p className="text-[10px] text-gray-400 mt-1 italic">Enable this to support .gif files. Your card will become a thumbnail while the GIF plays in full!</p>
            </div>
          </label>
        </div>
        
        {/* Preview Container */}
        <div className="mt-8 overflow-x-auto w-full custom-scrollbar pb-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 w-[800px] h-[300px] mx-auto relative bg-gray-900 group shrink-0">
             <img src={config.backgroundImage} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt="Background Preview" />
             <div className="absolute inset-0 bg-black/40" />
             <div className="absolute inset-0 flex items-center p-12 gap-8">
                <div className="w-[150px] h-[150px] rounded-full bg-discord border-4 border-white shrink-0 overflow-hidden shadow-2xl" style={{ borderColor: config.textColor }}>
                   <img src="https://cdn.discordapp.com/embed/avatars/0.png" className="w-full h-full object-cover" alt="Avatar" />
                </div>
                <div className="flex flex-col gap-2">
                   <h2 className="text-2xl font-bold tracking-widest drop-shadow-lg" style={{ color: config.textColor }}>WELCOME TO THE SERVER</h2>
                   <h1 className="text-4xl font-black tracking-wider drop-shadow-xl" style={{ color: config.textColor }}>USER</h1>
                   <p className="text-xl font-medium tracking-wider drop-shadow-md opacity-90" style={{ color: config.textColor }}>Member #123</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

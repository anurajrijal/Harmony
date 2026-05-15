import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';
import { HiPhoto, HiTrash, HiCloudArrowUp } from 'react-icons/hi2';
import { useRef } from 'react';


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
    welcomeImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    goodbyeImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    textColor: '#FFFFFF',
    welcomeGifMode: false,
    goodbyeGifMode: false,
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

  const welcomeInputRef = useRef(null);
  const leftInputRef = useRef(null);

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File too large (Max 10MB)');
    }

    const formData = new FormData();
    formData.append('image', file);

    const uploadToast = toast.loading(`Uploading ${type} asset...`);
    try {
      const res = await api.post('/api/upload/greeting', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setConfig({ ...config, [type === 'welcome' ? 'welcomeImage' : 'goodbyeImage']: res.data.url });
        toast.success('Asset uploaded successfully', { id: uploadToast });
      }
    } catch (err) {
      toast.error('Upload interference detected', { id: uploadToast });
    }
  };

  const removeImage = (type) => {
    setConfig({ ...config, [type === 'welcome' ? 'welcomeImage' : 'goodbyeImage']: '' });
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} asset removed`);
  };

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
      <div className="bg-[#0B0D12] p-8 rounded-xl border border-white/5 shadow-2xl space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Visuals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Background Visual (URL or Upload)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.welcomeImage}
                  onChange={(e) => setConfig({ ...config, welcomeImage: e.target.value })}
                  className="flex-1 bg-[#050608] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-discord transition-all shadow-inner"
                  placeholder="https://example.com/welcome.png"
                />
                <input type="file" ref={welcomeInputRef} onChange={(e) => handleUpload(e, 'welcome')} className="hidden" accept="image/*,.gif" />
                <button 
                  onClick={() => welcomeInputRef.current.click()}
                  className="px-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Upload Image"
                >
                  <HiCloudArrowUp className="text-xl" />
                </button>
                {config.welcomeImage && (
                  <button 
                    onClick={() => removeImage('welcome')}
                    className="px-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Remove Image"
                  >
                    <HiTrash className="text-xl" />
                  </button>
                )}
              </div>
              <label className="flex items-center cursor-pointer gap-3 mt-4">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={config.welcomeGifMode} onChange={(e) => setConfig({ ...config, welcomeGifMode: e.target.checked })} />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${config.welcomeGifMode ? 'bg-discord' : 'bg-gray-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.welcomeGifMode ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Enable Animated GIF Support</span>
              </label>
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
        </div>

        <div className="pt-8 border-t border-white/5">
          <h2 className="text-2xl font-bold text-white mb-6">Left Visuals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Background Visual (URL or Upload)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.goodbyeImage}
                  onChange={(e) => setConfig({ ...config, goodbyeImage: e.target.value })}
                  className="flex-1 bg-[#050608] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-discord transition-all shadow-inner"
                  placeholder="https://example.com/goodbye.png"
                />
                <input type="file" ref={leftInputRef} onChange={(e) => handleUpload(e, 'left')} className="hidden" accept="image/*,.gif" />
                <button 
                  onClick={() => leftInputRef.current.click()}
                  className="px-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Upload Image"
                >
                  <HiCloudArrowUp className="text-xl" />
                </button>
                {config.goodbyeImage && (
                  <button 
                    onClick={() => removeImage('left')}
                    className="px-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Remove Image"
                  >
                    <HiTrash className="text-xl" />
                  </button>
                )}
              </div>
              <label className="flex items-center cursor-pointer gap-3 mt-4">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={config.goodbyeGifMode} onChange={(e) => setConfig({ ...config, goodbyeGifMode: e.target.checked })} />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${config.goodbyeGifMode ? 'bg-discord' : 'bg-gray-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.goodbyeGifMode ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Enable Animated GIF Support</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Section */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Live Studio Previews</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-x-auto custom-scrollbar pb-4">
          {/* Welcome Preview */}
          <div className="space-y-4 min-w-[500px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Welcome Signal</span>
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[800/300] relative bg-gray-900 group shadow-2xl">
              <img src={config.welcomeImage} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt="Welcome Background" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center p-8 gap-6">
                <div className="w-[100px] h-[100px] rounded-full bg-discord border-2 border-white shrink-0 overflow-hidden shadow-2xl" style={{ borderColor: config.textColor }}>
                  <img src="https://cdn.discordapp.com/embed/avatars/0.png" className="w-full h-full object-cover" alt="Avatar" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold tracking-widest drop-shadow-lg uppercase" style={{ color: config.textColor }}>Welcome to the server</h2>
                  <h1 className="text-2xl font-black tracking-wider drop-shadow-xl" style={{ color: config.textColor }}>USER</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Goodbye Preview */}
          <div className="space-y-4 min-w-[500px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Departure Signal</span>
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[800/300] relative bg-gray-900 group shadow-2xl">
              <img src={config.goodbyeImage} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt="Goodbye Background" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center p-8 gap-6">
                <div className="w-[100px] h-[100px] rounded-full bg-red-500/20 border-2 border-white shrink-0 overflow-hidden shadow-2xl" style={{ borderColor: config.textColor }}>
                  <img src="https://cdn.discordapp.com/embed/avatars/0.png" className="w-full h-full object-cover grayscale" alt="Avatar" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-black tracking-wider drop-shadow-xl mb-1" style={{ color: config.textColor }}>GOODBYE, USER</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: config.textColor }}>We hope to see you again soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChatBubbleLeftRight, HiPlus, HiTrash, HiPencil, HiXMark, HiMagnifyingGlass } from 'react-icons/hi2';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import CustomSelect from '../../components/CustomSelect.jsx';

export default function KeywordManager() {
  const { guildId } = useParams();
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ keyword: '', response: '', responseType: 'text', isRegex: false, cooldown: 5, enabled: true, embedData: {} });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchKeywords(); }, [guildId]);

  const fetchKeywords = async () => {
    try {
      const res = await api.get(`/api/keywords?guildId=${guildId}`);
      setKeywords(res.data.keywords || []);
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ keyword: '', response: '', responseType: 'text', isRegex: false, cooldown: 5, enabled: true, embedData: {} });
    setModalOpen(true);
  };

  const openEdit = (kw) => {
    setEditItem(kw);
    setForm({ keyword: kw.keyword, response: kw.response, responseType: kw.responseType, isRegex: kw.isRegex, cooldown: kw.cooldown, enabled: kw.enabled, embedData: kw.embedData || {} });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/api/keywords/${editItem._id}`, { ...form, guildId });
        toast.success('Rule updated');
      } else {
        await api.post('/api/keywords', { ...form, guildId });
        toast.success('Rule created');
      }
      setModalOpen(false);
      fetchKeywords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/keywords/${id}`);
      toast.success('Rule deleted');
      fetchKeywords();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/api/keywords/${id}/toggle`);
      fetchKeywords();
    } catch { toast.error('Failed to toggle'); }
  };

  const filteredKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <HiChatBubbleLeftRight className="text-discord" />
            Intelligence Rules
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-discord bg-discord/10 px-2 py-0.5 rounded">Neural Processing</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{keywords.length} active rules</span>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-discord text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer border border-white/10"
        >
          <HiPlus className="text-lg" />
          Deploy New Rule
        </motion.button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
            <HiMagnifyingGlass className="text-gray-600 text-lg" />
          </div>
          <input 
            type="text" 
            placeholder="Search Intelligence Database..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-[#0b0c10]/60 border border-white/10 rounded-xl pl-5 pr-12 text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-discord focus:bg-[#0b0c10] transition-all shadow-inner block"
            style={{ lineHeight: '56px' }}
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />)}
        </div>
      ) : filteredKeywords.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0b0c10]/40 backdrop-blur-xl border border-dashed border-white/5 rounded-xl p-24 text-center"
        >
          <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center mx-auto mb-8 opacity-20">
            <HiChatBubbleLeftRight className="text-4xl text-white" />
          </div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-3">No Signals Detected</h3>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.1em] max-w-xs mx-auto mb-10">Start by creating your first automated response rule.</p>
          <button onClick={openCreate} className="text-discord font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors cursor-pointer bg-transparent border-0">Initiate Rule Creation →</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredKeywords.map((kw, i) => (
              <motion.div
                key={kw._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.02)' }}
                className={`bg-[#0b0c10]/40 backdrop-blur-xl border ${kw.enabled ? 'border-white/5' : 'border-red-500/10 opacity-60'} rounded-xl min-h-[260px] flex flex-col relative transition-all group`}
                style={{ padding: '2.5rem' }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-discord/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex flex-col gap-3 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-discord block">Trigger Signal</span>
                    <span className="font-mono text-xs font-black bg-discord/10 text-discord px-4 py-3 rounded-xl border border-discord/20 truncate max-w-[180px] block">
                      {kw.keyword}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggle(kw._id)}
                      className={`w-12 h-7 rounded-xl relative transition-all cursor-pointer border-0 ${kw.enabled ? 'bg-discord' : 'bg-white/5'}`}
                    >
                      <motion.div 
                        animate={{ x: kw.enabled ? 22 : 4 }}
                        className="w-4 h-4 bg-white rounded-lg absolute top-1.5" 
                      />
                    </button>
                  </div>
                </div>

                <div className="flex-1 mb-8 relative z-10 mt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 block">Neural Response</span>
                  <div className="p-6 min-h-[100px] rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 italic font-medium">
                      "{kw.response}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                  <div className="flex gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-white/5 border border-white/5 rounded-md text-gray-500">
                      {kw.responseType}
                    </span>
                    {kw.isRegex && (
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400">
                        Pattern
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => openEdit(kw)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-0"><HiPencil /></button>
                    <button onClick={() => handleDelete(kw._id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer border-0"><HiTrash /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal - Redesigned */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-3xl bg-[#0b0c10] border border-white/10 rounded-xl p-12 shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editItem ? 'Edit Signal' : 'Initiate Automation'}</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Neural Link Configuration v1.0</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all cursor-pointer">
                  <HiXMark className="text-xl" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Trigger Signal</label>
                    <input 
                      value={form.keyword} 
                      onChange={e => setForm({...form, keyword: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-discord focus:bg-white/[0.05] transition-all" 
                      placeholder="e.g. !hello" 
                    />
                  </div>
                  <CustomSelect 
                    label="Response Protocol"
                    value={form.responseType} 
                    options={[
                      { value: 'text', label: 'Standard Text' },
                      { value: 'embed', label: 'Advanced Embed' },
                    ]}
                    onChange={(val) => setForm({...form, responseType: val})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Neural Output</label>
                  <textarea 
                    value={form.response} 
                    onChange={e => setForm({...form, response: e.target.value})}
                    rows={4}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-6 py-5 text-sm font-medium focus:outline-none focus:border-discord focus:bg-white/[0.05] transition-all resize-none leading-relaxed" 
                    placeholder="Enter the transmission data..." 
                  />
                </div>

                <div className="flex items-center gap-8 p-6 bg-white/[0.01] rounded-xl border border-white/5">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={form.isRegex} 
                      onChange={e => setForm({...form, isRegex: e.target.checked})} 
                      className="w-5 h-5 rounded-lg bg-black border-white/10 accent-discord" 
                    />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Pattern Sync</span>
                  </label>
                  <div className="w-[1px] h-6 bg-white/5" />
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Cooldown:</span>
                    <input 
                      type="number" 
                      value={form.cooldown} 
                      onChange={e => setForm({...form, cooldown: parseInt(e.target.value) || 0})}
                      className="w-16 bg-transparent border-b-2 border-white/10 text-xs font-black text-discord focus:outline-none focus:border-discord text-center transition-all" 
                    />
                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Seconds</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-5 rounded-xl bg-white/[0.02] text-gray-600 border border-white/5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                >
                  Abort
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 py-5 rounded-xl bg-discord text-white font-black text-[10px] uppercase tracking-[0.3em] border border-white/10 cursor-pointer"
                >
                  {editItem ? 'Update Link' : 'Deploy Automation'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

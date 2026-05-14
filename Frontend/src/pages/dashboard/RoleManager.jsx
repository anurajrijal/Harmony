import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiShieldCheck, HiPlus, HiTrash, HiXMark, HiMagnifyingGlass, HiHashtag, HiFingerPrint } from 'react-icons/hi2';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import CustomSelect from '../../components/CustomSelect.jsx';

const typeColors = { 
  'auto-join': '#10b981', 
  'reaction': '#a855f7', 
  'action': '#f59e0b' 
};

const typeLabels = { 
  'auto-join': 'Join Trigger', 
  'reaction': 'Reaction Role', 
  'action': 'Action Logic' 
};

export default function RoleManager() {
  const { guildId } = useParams();
  const [rules, setRules] = useState([]);
  const [discordRoles, setDiscordRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'auto-join', roleId: '', roleName: '', messageId: '', channelId: '', emoji: '', enabled: true });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchData(); }, [guildId]);

  const fetchData = async () => {
    try {
      const [rulesRes, rolesRes] = await Promise.all([
        api.get(`/api/roles?guildId=${guildId}`),
        api.get(`/api/guilds/${guildId}/roles`).catch(() => ({ data: { roles: [] } })),
      ]);
      setRules(rulesRes.data.rules || []);
      setDiscordRoles(rolesRes.data.roles || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      const selectedRole = discordRoles.find(r => r.id === form.roleId);
      await api.post('/api/roles', { ...form, guildId, roleName: selectedRole?.name || form.roleId });
      toast.success('System updated');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/roles/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/api/roles/${id}/toggle`);
      fetchData();
    } catch { toast.error('Failed to toggle'); }
  };

  const filteredRules = rules.filter(r => 
    r.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <HiShieldCheck className="text-green-500" />
            Security Clearance
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Access Protocol</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rules.length} active integrations</span>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setForm({ type: 'auto-join', roleId: '', roleName: '', messageId: '', channelId: '', emoji: '', enabled: true }); setModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer border border-green-500/20"
        >
          <HiPlus className="text-lg" />
          Deploy Integration
        </motion.button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
            <HiMagnifyingGlass className="text-gray-600 text-lg" />
          </div>
          <input 
            type="text" 
            placeholder="Search Security Database..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-[#0b0c10]/60 border border-white/10 rounded-xl pl-12 pr-5 text-[13px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-green-500/70 focus:bg-[#0b0c10] transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />)}
        </div>
      ) : filteredRules.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0b0c10]/40 backdrop-blur-xl border border-dashed border-white/5 rounded-xl p-24 text-center"
        >
          <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center mx-auto mb-8 opacity-20">
            <HiShieldCheck className="text-4xl text-white" />
          </div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-3">No Protocols Active</h3>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.1em] max-w-xs mx-auto mb-10">Configure your first automated role assignment logic.</p>
          <button onClick={() => setModalOpen(true)} className="text-green-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors cursor-pointer bg-transparent border-0">Initiate Protocol →</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredRules.map((rule, i) => (
              <motion.div
                key={rule._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.02)' }}
                className={`bg-[#0b0c10]/40 backdrop-blur-xl border ${rule.enabled ? 'border-white/5' : 'border-red-500/10 opacity-60'} rounded-xl p-8 flex flex-col relative overflow-hidden transition-all group`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" style={{ from: typeColors[rule.type] }} />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex flex-col gap-3">
                    <span 
                      className="text-[8px] font-black uppercase tracking-[0.3em] px-2.5 py-1.5 rounded-lg inline-block w-fit border border-white/5"
                      style={{ backgroundColor: typeColors[rule.type] + '15', color: typeColors[rule.type] }}
                    >
                      {typeLabels[rule.type]}
                    </span>
                    <h3 className="text-lg font-black text-white truncate max-w-[180px] tracking-tight">
                      @{rule.roleName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggle(rule._id)}
                      className={`w-12 h-7 rounded-xl relative transition-all cursor-pointer border-0 shadow-inner ${rule.enabled ? 'bg-green-600' : 'bg-white/5'}`}
                    >
                      <motion.div 
                        animate={{ x: rule.enabled ? 22 : 4 }}
                        className="w-4 h-4 bg-white rounded-lg absolute top-1.5" 
                      />
                    </button>
                  </div>
                </div>

                <div className="flex-1 mb-8 relative z-10 flex flex-col gap-4">
                  {rule.type === 'reaction' && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                      <div className="flex items-center gap-3 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        <HiHashtag className="text-discord text-xs" />
                        <span className="truncate">MSG: {rule.messageId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        <div className="w-5 h-5 bg-white/5 rounded-lg flex items-center justify-center text-xs shadow-inner">{rule.emoji}</div>
                        <span>Reaction Trigger</span>
                      </div>
                    </div>
                  )}
                  {rule.type === 'auto-join' && (
                    <div className="p-4 rounded-xl bg-green-500/[0.02] border border-green-500/10">
                      <p className="text-[9px] text-green-500/60 font-black uppercase tracking-widest leading-relaxed">System: Assigning access key immediately upon entry signal</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                  <div className="flex items-center gap-2">
                    <HiFingerPrint className="text-gray-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 tabular-nums">HEX: {rule.roleId.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => handleDelete(rule._id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer border-0"><HiTrash /></button>
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
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Protocol</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Security System Integration v1.2</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all cursor-pointer">
                  <HiXMark className="text-xl" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <CustomSelect 
                    label="Protocol Type"
                    value={form.type}
                    options={[
                      { value: 'auto-join', label: 'Join Integration' },
                      { value: 'reaction', label: 'Reaction Interface' },
                      { value: 'action', label: 'Action Overload' },
                    ]}
                    onChange={(val) => setForm({...form, type: val})}
                  />
                  
                  <CustomSelect 
                    label="Target Clearance"
                    value={form.roleId}
                    options={discordRoles.map(r => ({ value: r.id, label: r.name }))}
                    onChange={(val) => setForm({...form, roleId: val})}
                    placeholder="Select Discord Role..."
                  />
                </div>

                {form.type === 'reaction' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5"
                  >
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Message ID</label>
                      <input 
                        value={form.messageId} 
                        onChange={e => setForm({...form, messageId: e.target.value})}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-green-500 transition-all" 
                        placeholder="1234567890..." 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">Trigger Key</label>
                      <input 
                        value={form.emoji} 
                        onChange={e => setForm({...form, emoji: e.target.value})}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 text-xl text-center focus:outline-none focus:border-green-500 transition-all" 
                        placeholder="✅" 
                      />
                    </div>
                  </motion.div>
                )}

                <div className="p-6 bg-green-500/[0.01] rounded-xl border border-green-500/10">
                  <p className="text-[9px] font-black text-green-500/50 uppercase tracking-[0.3em] leading-relaxed text-center">
                    Warning: Ensure Harmony elevation is configured above target roles in Discord settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-5 rounded-xl bg-white/[0.02] text-gray-600 border border-white/5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                >
                  Terminate
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  className="flex-1 py-5 rounded-xl bg-green-600 text-white font-black text-[10px] uppercase tracking-[0.3em] border border-green-500/20 cursor-pointer"
                >
                  Deploy Protocol
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

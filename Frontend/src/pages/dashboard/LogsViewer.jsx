import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiDocumentText, HiFunnel } from 'react-icons/hi2';
import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

const typeColors = { command: '#5865F2', music: '#a855f7', keyword: '#00d4ff', role: '#10b981', error: '#ef4444', system: '#f59e0b' };

export default function LogsViewer() {
  const { guildId } = useParams();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bottomRef = useRef(null);

  useEffect(() => { fetchLogs(); }, [guildId, filter, page]);

  useEffect(() => {
    const handler = (log) => {
      if (log.guildId === guildId) {
        setLogs(prev => [log, ...prev].slice(0, 100));
      }
    };
    socket.on('log-event', handler);
    return () => socket.off('log-event', handler);
  }, [guildId]);

  const fetchLogs = async () => {
    try {
      const typeParam = filter !== 'all' ? `&type=${filter}` : '';
      const res = await api.get(`/api/logs?guildId=${guildId}&limit=50&page=${page}${typeParam}`);
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {} finally { setLoading(false); }
  };

  const filters = ['all', 'command', 'music', 'keyword', 'role', 'error', 'system'];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <HiDocumentText className="text-amber-500" />
            Forensic Uplink
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Live Stream</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol v4.0 Active</span>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="flex items-center gap-2 p-1.5 bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="px-3">
            <HiFunnel className="text-gray-600 text-sm" />
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[300px] md:max-w-none">
            {filters.map(f => (
              <button 
                key={f} 
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer border border-transparent transition-all whitespace-nowrap
                  ${filter === f 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-lg shadow-amber-900/10' 
                    : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Logs Deck */}
      <motion.div 
        className="bg-[#0b0c10]/40 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-[600px] shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
          </div>
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em]">Audit_Log_Terminal.exe</span>
        </div>

        <div className="flex-1 p-4 relative">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="flex gap-4 items-center animate-pulse">
                  <div className="w-20 h-3 bg-white/5 rounded" />
                  <div className="flex-1 h-3 bg-white/5 rounded" />
                  <div className="w-12 h-3 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] opacity-10 grayscale">
              <HiDocumentText className="text-6xl mb-6" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Uplink Detected</p>
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-[650px] custom-scrollbar px-2">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div 
                    key={log._id || i}
                    className="flex items-center gap-6 p-3 rounded-lg hover:bg-white/[0.02] transition-all group font-mono relative overflow-hidden"
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <span className="text-[9px] font-bold text-gray-700 tabular-nums shrink-0 w-[140px] uppercase">
                      [{new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                    </span>

                    <div className="flex items-center gap-3 shrink-0">
                      <div 
                        className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                        style={{ backgroundColor: typeColors[log.type] || '#5865F2', boxShadow: `0 0 10px ${typeColors[log.type]}40` }} 
                      />
                      <span 
                        className="text-[9px] font-black uppercase tracking-widest w-[80px]" 
                        style={{ color: typeColors[log.type] || '#5865F2' }}
                      >
                        {log.type}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-gray-300 tracking-tight uppercase group-hover:text-white transition-colors">
                        {log.action}
                      </span>
                      {log.details && (
                        <span className="ml-3 text-[10px] text-gray-600 font-medium">
                          // {log.details}
                        </span>
                      )}
                    </div>

                    {log.username && (
                      <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        USER: {log.username}
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Terminal Footer / Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
              UPLINK_PAGE: {page} / {totalPages}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-6 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/[0.05] disabled:opacity-10 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous_Block
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="px-6 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/[0.05] disabled:opacity-10 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next_Block
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

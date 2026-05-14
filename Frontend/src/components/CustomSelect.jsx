import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown } from 'react-icons/hi2';

export default function CustomSelect({ label, value, options, onChange, placeholder = "Select Protocol..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 relative" ref={containerRef}>
      {label && <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/[0.02] border ${isOpen ? 'border-green-500/50' : 'border-white/5'} rounded-xl px-5 py-4 text-sm font-bold text-left flex items-center justify-between hover:bg-white/[0.05] transition-all cursor-pointer group shadow-inner`}
      >
        <span className={selectedOption ? "text-white uppercase tracking-widest text-[11px] font-black" : "text-gray-600 uppercase tracking-widest text-[11px] font-black"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <HiChevronDown className={`text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-green-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute z-[150] w-full mt-2 bg-[#0b0c10] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-3 group relative ${value === opt.value ? 'bg-green-500/10 text-green-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  {value === opt.value && (
                    <motion.div 
                      layoutId="active-dot"
                      className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" 
                    />
                  )}
                  <span className={value === opt.value ? 'ml-0' : 'ml-4.5'}>{opt.label}</span>
                  
                  {value === opt.value && (
                    <div className="ml-auto text-[8px] opacity-40 font-bold">ACTIVE</div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

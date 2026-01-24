
import React, { useEffect } from 'react';
import { AlertCircle, X, Terminal } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  code?: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, code, type = 'error', onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    error: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/[0.03]',
      iconColor: 'text-rose-500',
      label: 'System Fault',
      shadow: 'shadow-rose-900/20'
    },
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/[0.03]',
      iconColor: 'text-emerald-500',
      label: 'Protocol Verified',
      shadow: 'shadow-emerald-900/20'
    },
    info: {
      border: 'border-taupe-accent/30',
      bg: 'bg-taupe-accent/[0.03]',
      iconColor: 'text-taupe-accent',
      label: 'System Update',
      shadow: 'shadow-taupe-accent/20'
    }
  }[type];

  return (
    <div className={`fixed top-8 right-8 z-[10000] w-full max-w-sm animate-in slide-in-from-right-10 duration-500 ease-out`}>
      <div className={`neo-3d-card p-1 overflow-hidden ${config.border} ${config.shadow}`}>
        <div className={`${config.bg} rounded-[1.4rem] p-5 flex items-start gap-4 backdrop-blur-3xl`}>
          <div className={`p-3 bg-black/40 rounded-xl ${config.iconColor} border border-white/5 shadow-inner`}>
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1 pr-6 pt-0.5">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${config.iconColor}`}>
                {config.label} {code ? `// ${code}` : ''}
              </span>
            </div>
            <p className="text-[13px] font-bold text-white/90 leading-tight">
              {message}
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close notification"
            className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent w-full opacity-30" />
        </div>
      </div>
    </div>
  );
};

export default Toast;

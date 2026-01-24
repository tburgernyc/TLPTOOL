import React from 'react';
import { Sparkles, History, Compass } from 'lucide-react';
import CelestialBackground from './CelestialBackground';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'generator' | 'history';
  onTabChange: (tab: 'generator' | 'history') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-gold-accent/30 overflow-x-hidden relative">
      <CelestialBackground />

      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-gold-accent/10 bg-black/60 backdrop-blur-3xl">
        <div className="max-w-screen-xl mx-auto px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-4 cursor-pointer group" 
            onClick={() => onTabChange('generator')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-800 flex items-center justify-center text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-all duration-500">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex flex-col -gap-1">
              <h1 className="text-lg font-black tracking-[0.4em] text-white uppercase group-hover:text-gold-accent transition-colors">
                TLP <span className="font-light opacity-50">Video Tool</span>
              </h1>
              <span className="text-[7px] font-black tracking-[0.6em] text-gold-accent uppercase opacity-60">MASTER PROMPT V3.8</span>
            </div>
          </div>
          
          <nav className="flex items-center p-1.5 bg-white/[0.03] rounded-2xl border border-white/[0.05] shadow-inner">
            <button 
              onClick={() => onTabChange('generator')}
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                activeTab === 'generator' 
                ? 'bg-gold-accent text-black shadow-[0_10px_20px_rgba(212,175,55,0.3)]' 
                : 'text-slate-500 hover:text-gold-accent/60'
              }`}
            >
              Generator
            </button>
            <button 
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                activeTab === 'history' 
                ? 'bg-gold-accent text-black shadow-[0_10px_20px_rgba(212,175,55,0.3)]' 
                : 'text-slate-500 hover:text-gold-accent/60'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto px-8 pt-40 pb-32 w-full z-10">
        {children}
      </main>

      <footer className="border-t border-gold-accent/5 py-24 bg-black/80 backdrop-blur-xl z-10">
        <div className="max-w-screen-xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-4">
               <Sparkles className="w-4 h-4 text-gold-accent opacity-50" />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gold-accent opacity-80">
                 Illuminating Truth and Guidance
               </p>
             </div>
             <p className="text-[11px] font-medium text-slate-500 max-w-sm leading-relaxed uppercase tracking-widest">
               Precision Engineered for Tarot Light Path with Tim B.<br/>
               The standard in authentic tarot synthesis.
             </p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Release</span>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">v3.8 Stable</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Protocol</span>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Encrypted Synthesis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
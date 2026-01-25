import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './Layout';
import ReadingForm from './ReadingForm';
import TarotSpreadVisualizer from './TarotSpreadVisualizer';
import ManualCardEntry from './ManualCardEntry';
import ScriptViewer from './ScriptViewer';
import Toast, { ToastType } from './Toast';
import LoadingIndicator from './LoadingIndicator';
import { ReadingParams, GeneratedReading, Spread, TarotCard, ReadingMode } from './types';
import { TAROT_DECK } from './constants';
import { fetchAstrology, generatePart1, generatePart2, generateSpeech, TLPError } from './geminiService';
import { Moon, Star, ChevronDown, ChevronUp, History, Trash2, Clock, ShieldCheck, Zap, Globe, ChevronRight, Sparkles, Layout as LayoutIcon, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReading, setCurrentReading] = useState<GeneratedReading | null>(null);
  const [history, setHistory] = useState<GeneratedReading[]>([]);
  const [showAstrology, setShowAstrology] = useState(true);
  const [showManualSpread, setShowManualSpread] = useState(false);
  const [toast, setToast] = useState<{ message: string; code?: string; type: ToastType } | null>(null);

  const pullRandomCard = useCallback((): TarotCard => ({
    name: TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)],
    orientation: Math.random() > 0.25 ? 'Upright' : 'Reversed',
    imageUrl: ''
  }), []);

  const generateRandomSpread = useCallback((): Spread => ({
    situation: Array(3).fill(null).map(pullRandomCard),
    feelings: Array(3).fill(null).map(pullRandomCard),
    message: Array(3).fill(null).map(pullRandomCard),
    outcome: Array(3).fill(null).map(pullRandomCard),
    bottom: pullRandomCard()
  }), [pullRandomCard]);

  const [manualSpread, setManualSpread] = useState<Spread>(() => generateRandomSpread());

  useEffect(() => {
    const saved = localStorage.getItem('tlp_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (reading: GeneratedReading) => {
    setHistory(prev => {
      const filtered = prev.filter(r => r.id !== reading.id);
      const updated = [reading, ...filtered].slice(0, 25);
      localStorage.setItem('tlp_history', JSON.stringify(updated));
      return updated;
    });
  };

  const showToast = useCallback((message: string, code?: string, type: ToastType = 'error') => {
    setToast({ message, code, type });
  }, []);

  const handleStartGeneration = async (params: ReadingParams) => {
    setIsLoading(true);
    setToast(null);
    setCurrentReading(null);
    
    try {
      // Step 1: Celestial Data Retrieval
      const astroData = await fetchAstrology(params.startDate, params.endDate);
      
      // Step 2: Part 1 Synthesis (Intro/Hook)
      const introText = await generatePart1(params, astroData);

      const isManualMode = params.mode === ReadingMode.MANUAL_COLLECTIVE || params.mode === ReadingMode.MANUAL_SPECIFIC;

      if (!isManualMode) {
        // AUTOMATED WORKFLOW: Complete the reading immediately
        const spread = showManualSpread ? manualSpread : generateRandomSpread();
        const fullBody = await generatePart2(params, astroData, spread, introText);
        const fullScript = `${introText}\n\n${fullBody}`;
        const wordCount = fullScript.split(/\s+/).length;

        let audioData: string | undefined;
        if (params.includeAudio) {
          try {
            audioData = await generateSpeech(fullScript);
          } catch (e) {
            console.warn("TTS skipped", e);
            showToast('Audio synthesis failed. Text-only mode active.', 'TTS_WARN', 'warning');
          }
        }

        const reading: GeneratedReading = {
          id: crypto.randomUUID(), params, astrology: astroData, spread,
          hook: introText.split('\n')[0], introText, readingBody: fullBody,
          fullScript, audioData, wordCount, createdAt: Date.now()
        };
        setCurrentReading(reading);
        saveToHistory(reading);
        showToast('Full Synthesis Complete.', 'SYNC_OK', 'success');
        
        setTimeout(() => {
          document.getElementById('script-output')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      } else {
        // MANUAL WORKFLOW (TWO-PART): Stop after Intro, prepare for Node Capture
        const reading: GeneratedReading = {
          id: crypto.randomUUID(), params, astrology: astroData,
          spread: showManualSpread ? manualSpread : generateRandomSpread(),
          hook: introText.split('\n')[0], introText,
          fullScript: introText, wordCount: introText.split(/\s+/).length,
          createdAt: Date.now()
        };
        setCurrentReading(reading);
        saveToHistory(reading);
        showToast('Stage 01 Anchor Finalized. Ready for Node Capture.', 'STAGE_01_OK', 'info');
        
        setTimeout(() => {
          document.getElementById('script-output')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (e: any) {
      showToast(e instanceof TLPError ? e.message : 'Celestial transmission failure.', e?.code);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReading = async (updated: GeneratedReading) => {
    setCurrentReading(updated);
    saveToHistory(updated);
  };

  const clearHistory = () => {
    if (window.confirm("Purge all archive records?")) {
      setHistory([]);
      localStorage.removeItem('tlp_history');
      showToast('Archive purged.', 'CLEAN_OK', 'info');
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vw] bg-white/[0.02] rounded-full blur-[160px] -z-10 animate-soft-pulse pointer-events-none" />
      
      {isLoading && !currentReading && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center">
          <LoadingIndicator size="lg" label="Synchronizing Celestial Data..." />
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {activeTab === 'generator' ? (
        <div className="space-y-48">
          <section className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-32 space-y-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Verified TLP Protocol v3.8</span>
              </div>
              
              <div className="relative mx-auto w-full max-w-4xl aspect-[21/9] mb-16 perspective-container group">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 rounded-[3rem]" />
                <div className="relative w-full h-full neo-3d-card p-1.5 overflow-hidden rounded-[3rem] border border-gold-accent/20">
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2300&auto=format&fit=crop')` }}
                  />
                  <div className="absolute bottom-8 left-8 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-gold-accent animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Celestial Altar Active</span>
                  </div>
                </div>
              </div>

              <h2 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter shimmer-text">
                TLP <span className="font-light opacity-50">Video Tool</span>
              </h2>
            </div>
            
            <div className="space-y-12">
              <ReadingForm onSubmit={handleStartGeneration} isLoading={isLoading} />
              
              <div className="neo-3d-card p-8 md:p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <LayoutIcon className="w-6 h-6 text-taupe-accent" />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Node Configuration Override</h3>
                  </div>
                  <button 
                    onClick={() => setShowManualSpread(!showManualSpread)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${showManualSpread ? 'bg-gold-accent text-black' : 'text-taupe-accent hover:text-white'}`}
                  >
                    {showManualSpread ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showManualSpread ? 'Override Active' : 'Manual Override'}
                  </button>
                </div>
                
                {showManualSpread && (
                  <div className="pt-8 border-t border-white/[0.05] animate-in fade-in slide-in-from-top-4 duration-500">
                    <p className="text-[10px] font-bold text-taupe-accent/60 uppercase tracking-widest mb-10 text-center">
                      Pre-define your node matrix below to bypass random generation logic.
                    </p>
                    <ManualCardEntry spread={manualSpread} onChange={setManualSpread} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {currentReading && (
            <div className="space-y-56 animate-in fade-in duration-1000 px-4">
              <section className="neo-3d-card overflow-hidden">
                <button 
                  onClick={() => setShowAstrology(!showAstrology)}
                  className="w-full flex items-center justify-between p-14 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-10">
                    <Moon className="w-10 h-10 text-taupe-accent" />
                    <div className="text-left space-y-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-[0.6em]">Celestial Verification</h3>
                    </div>
                  </div>
                  {showAstrology ? <ChevronUp className="w-7 h-7" /> : <ChevronDown className="w-7 h-7" />}
                </button>
                {showAstrology && (
                  <div className="p-14 pt-0 grid grid-cols-1 md:grid-cols-3 gap-14">
                    <div className="neo-3d-input p-12 space-y-8">
                      <span className="text-[10px] text-taupe-accent uppercase tracking-[0.5em] font-black">Lunar Phase</span>
                      <p className="text-3xl text-white font-black">{currentReading.astrology.moonPhase}</p>
                    </div>
                    <div className="neo-3d-input p-12 space-y-8">
                      <span className="text-[10px] text-taupe-accent uppercase tracking-[0.5em] font-black">Retrogrades</span>
                      <p className="text-sm text-white font-bold">{currentReading.astrology.retrogrades.join(', ') || 'None'}</p>
                    </div>
                    <div className="neo-3d-input p-12 space-y-8">
                      <span className="text-[10px] text-taupe-accent uppercase tracking-[0.5em] font-black">Central Pattern</span>
                      <p className="text-[15px] text-slate-400 italic font-bold">"{currentReading.astrology.theme}"</p>
                    </div>
                  </div>
                )}
              </section>

              {currentReading.readingBody && (
                <section className="space-y-32">
                  <div className="text-center space-y-6">
                    <h3 className="text-sm font-black text-taupe-accent uppercase tracking-[0.8em]">Node Visualizer</h3>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-taupe-accent/20 to-transparent mx-auto" />
                  </div>
                  <TarotSpreadVisualizer spread={currentReading.spread} />
                </section>
              )}

              <section id="script-output" className="pt-24 scroll-mt-40">
                <ScriptViewer reading={currentReading} onPart2Generated={handleUpdateReading} />
              </section>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-32 animate-fade-in-up px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-5xl font-black uppercase text-white">Archive Vault</h2>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="flex items-center gap-3 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Purge History
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="py-40 text-center neo-3d-card opacity-40">
              <Clock className="w-24 h-24 mx-auto mb-8" />
              <p className="font-black uppercase tracking-[0.6em]">The archive is currently inert.</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {history.map(r => (
                <div key={r.id} className="neo-3d-card p-10 flex items-center justify-between group hover:border-gold-accent/40">
                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-gold-accent transition-colors">{r.params.sign}: {r.params.topic}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-2">
                      {new Date(r.createdAt).toLocaleDateString()} // {r.params.mode} // {r.wordCount} UNITS
                    </p>
                  </div>
                  <button 
                    onClick={() => { 
                      setCurrentReading(r); 
                      setActiveTab('generator'); 
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-10 py-4 neo-3d-button !text-white text-[12px] font-black uppercase"
                  >
                    Retrieve Data
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { parseScriptToWords, findMatchingWordIndex, WordToken } from './scriptParser';
import { X, Play, Pause, RotateCcw, Mic, MicOff, Type, FlipHorizontal, ChevronLeft, ChevronRight, Zap, Radio, Info, Activity, MousePointer2, BrainCircuit, Keyboard } from 'lucide-react';
import CardCaptureWidget from './CardCaptureWidget';
import { VolumeIndicator } from './VolumeIndicator';
import Toast, { ToastType } from './Toast';
import { generatePart2, TLPError } from './geminiService';
import LoadingIndicator from './LoadingIndicator';
import { Spread, ReadingParams, AstrologyData } from './types';
import './Teleprompter.css';

interface TeleprompterModalProps {
  script: string;
  onClose: () => void;
  isPhase1?: boolean;
  onPart2Generated?: (fullScript: string, spread?: Spread) => void;
  initialParams?: ReadingParams;
  astrologyData?: AstrologyData;
}

const TeleprompterModal: React.FC<TeleprompterModalProps> = ({ 
  script: initialScript, 
  onClose, 
  isPhase1, 
  onPart2Generated,
  initialParams,
  astrologyData
}) => {
  const [script, setScript] = useState(initialScript);
  const [isPaused, setIsPaused] = useState(true);
  const [fontSize, setFontSize] = useState(38); 
  const [scrollSpeed, setScrollSpeed] = useState(180);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isMirror, setIsMirror] = useState(false);
  const [voiceTracking, setVoiceTracking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSmartScroll, setIsSmartScroll] = useState(true);
  
  const [modalToast, setModalToast] = useState<{ message: string; code?: string; type: ToastType } | null>(null);
  const [capturedCards, setCapturedCards] = useState<any[]>([]);
  // Lifted state to handle keyboard shortcuts for confirmation
  const [pendingCard, setPendingCard] = useState<any>(null);

  const displayRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef<boolean>(false);
  
  const speech = useSpeechRecognition({ disableVolumeState: true });
  const { isListening, transcript, volume, start, stop, reset, error: micError } = speech;

  const words = useMemo(() => parseScriptToWords(script), [script]);

  const toggleVoiceTracking = useCallback(() => {
    if (!voiceTracking) {
      setVoiceTracking(true);
      reset();
      start();
      setIsPaused(false);
    } else {
      setVoiceTracking(false);
      stop();
    }
  }, [voiceTracking, reset, start, stop]);

  const finalizeReading = useCallback(async (allCards: any[]) => {
    setIsGenerating(true);
    setIsPaused(true);
    setVoiceTracking(false);
    stop();
    
    try {
      const spread: Spread = {
        situation: allCards.slice(0, 3),
        feelings: allCards.slice(3, 6),
        message: allCards.slice(6, 9),
        outcome: allCards.slice(9, 12),
        bottom: allCards[12]
      };
      
      const part2 = await generatePart2(initialParams!, astrologyData!, spread, script);
      const full = `${script}\n\n${part2}`;
      
      setScript(full);
      onPart2Generated!(full, spread);
      setIsGenerating(false);
      setModalToast({ message: 'Semantic Matrix Synthesized. Script Updated.', type: 'success' });
      
      setTimeout(() => setIsPaused(false), 2000);
    } catch (e: any) {
      console.error('Teleprompter Protocol Error:', e);
      setModalToast({ message: e instanceof TLPError ? e.message : 'Narrative synthesis failure.', type: 'error' });
      setIsGenerating(false);
    }
  }, [initialParams, astrologyData, script, onPart2Generated, stop]);

  // Handler for confirmed cards (via UI or Keyboard)
  const handleConfirmCard = useCallback(() => {
    if (pendingCard && isPhase1) {
      const allCards = [...capturedCards, pendingCard.card];
      setCapturedCards(allCards);

      // Check for completion
      if (allCards.length === 13 && onPart2Generated && initialParams && astrologyData) {
        finalizeReading(allCards);
      }

      setPendingCard(null);
      reset(); // Clear speech transcript
    }
  }, [pendingCard, capturedCards, isPhase1, onPart2Generated, initialParams, astrologyData, reset, finalizeReading]);

  const handleCardCaptured = useCallback((card: any) => {
    const all = [...capturedCards, card];
    setCapturedCards(all);
    if (all.length === 13) finalizeReading(all);
  }, [capturedCards, finalizeReading]);

  const handleReset = useCallback(() => setCapturedCards([]), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Prevent shortcut trigger if user is somehow in an input (though rare here)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.code;
      const char = e.key.toLowerCase();

      if (key === 'Space') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        setScrollSpeed(s => Math.min(s + 5, 450));
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        setScrollSpeed(s => Math.max(s - 5, 40));
      } else if (char === 'm') {
        e.preventDefault();
        setIsMirror(prev => !prev);
      } else if (char === 'v') {
        e.preventDefault();
        toggleVoiceTracking();
      } else if (key === 'Enter' && pendingCard) {
        e.preventDefault();
        handleConfirmCard();
      } else if (key === 'Backspace' && pendingCard) {
        e.preventDefault();
        setPendingCard(null);
        reset();
      } else if (key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, pendingCard, handleConfirmCard, toggleVoiceTracking, reset]);

  useEffect(() => {
    if (micError) {
      setModalToast({ message: `Acoustic Hardware Fault: ${micError}`, type: 'error' });
      setVoiceTracking(false);
    }
  }, [micError]);

  useEffect(() => {
    if (voiceTracking && isListening && transcript) {
      const nextIndex = findMatchingWordIndex(transcript, words, currentWordIndex);
      if (nextIndex > currentWordIndex) {
        setCurrentWordIndex(nextIndex);
      }
    }
  }, [transcript, voiceTracking, isListening, words, currentWordIndex]);

  const calculateNextWordDelay = useCallback((index: number) => {
    const baseDelay = (60 * 1000) / scrollSpeed;
    if (!isSmartScroll) return baseDelay;

    const word = words[index];
    if (!word) return baseDelay;

    let multiplier = 1.0;
    if (word.text.length > 8) multiplier += 0.3;
    else if (word.text.length > 5) multiplier += 0.15;
    
    if (/[.!?;]/.test(word.original)) multiplier += 1.2;
    else if (/,:/.test(word.original)) multiplier += 0.6;
    
    if (word.original.includes('[PAUSE]')) multiplier += 2.5;
    if (word.original.includes('[EMPHASIS]')) multiplier += 0.4;

    return baseDelay * multiplier;
  }, [scrollSpeed, isSmartScroll, words]);

  useEffect(() => {
    const triggerNextWord = () => {
      if (isPaused || voiceTracking || currentWordIndex >= words.length - 1) return;

      const delay = calculateNextWordDelay(currentWordIndex);
      scrollTimeoutRef.current = window.setTimeout(() => {
        isAutoScrollingRef.current = true;
        setCurrentWordIndex(prev => Math.min(prev + 1, words.length - 1));
      }, delay);
    };

    triggerNextWord();
    return () => { if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current); };
  }, [currentWordIndex, isPaused, voiceTracking, calculateNextWordDelay, words.length]);

  useEffect(() => {
    const targetWord = wordRefs.current[currentWordIndex];
    if (targetWord && displayRef.current) {
      const container = displayRef.current;
      const wordRect = targetWord.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const scrollTop = container.scrollTop + (wordRect.top - containerRect.top) - (containerRect.height / 2) + (wordRect.height / 2);
      
      container.scrollTo({ 
        top: scrollTop, 
        behavior: isAutoScrollingRef.current ? 'smooth' : 'auto' 
      });
      isAutoScrollingRef.current = false;
    }
  }, [currentWordIndex]);

  const progress = Math.round((currentWordIndex / (words.length - 1 || 1)) * 100);

  return (
    <div className={`teleprompter-modal ${isMirror ? 'mirror-mode' : ''}`}>
      {modalToast && <Toast {...modalToast} onClose={() => setModalToast(null)} />}

      {isGenerating && (
        <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl z-[300] flex flex-col items-center justify-center p-8 text-center">
          <LoadingIndicator size="lg" label="Synchronizing 13 Nodes with Narrative Engine..." />
          <div className="mt-12 space-y-3 opacity-40">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white animate-pulse">Final Reading Calibration</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-gold-accent">TLP System OS 3.8 Stable</p>
          </div>
        </div>
      )}
      
      <div className="teleprompter-header border-b border-white/5">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-30">Archive ID</span>
            <div className="text-[16px] font-black tracking-tighter text-white uppercase flex items-center gap-3">
              <span className="text-gold-accent">{initialParams?.sign}</span>
              <span className="opacity-10 text-[10px]">/</span>
              <span>{isPhase1 ? 'STAGE 01' : 'FINAL BROADCAST'}</span>
            </div>
          </div>
          
          {isListening && <VolumeIndicator subscribeToVolume={speech.subscribeToVolume} />}
        </div>
        
        <div className="flex items-center gap-12">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black tracking-widest uppercase opacity-30">Protocol Progress</span>
              <span className="text-xl font-black text-gold-accent tabular-nums tracking-tighter">{progress}%</span>
           </div>
           <button 
            onClick={onClose} 
            className="p-5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl border border-white/5 transition-all group"
            title="Terminate Protocol (ESC)"
          >
            <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div ref={displayRef} className="teleprompter-display-area w-full">
          <div className="teleprompter-overlay-center" />
          <div className="teleprompter-text-container" style={{ fontSize: `${fontSize}px` }}>
            {words.map((word, i) => (
              <span
                key={`${word.text}-${i}`}
                ref={el => { wordRefs.current[i] = el; }}
                className={`teleprompter-word ${i === currentWordIndex ? 'current' : i < currentWordIndex ? 'passed' : 'upcoming'}`}
              >
                {word.original}
              </span>
            ))}
          </div>
        </div>

        {/* Shortcuts Hint Bar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-black/60 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/5 z-40 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded-md text-[9px] font-black text-white/60">SPACE</kbd>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Toggle</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded-md text-[9px] font-black text-white/60">↑/↓</kbd>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded-md text-[9px] font-black text-white/60">M</kbd>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Mirror</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded-md text-[9px] font-black text-white/60">V</kbd>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Voice</span>
          </div>
          {isPhase1 && (
            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-black">ENT</kbd>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Capture</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-md text-[9px] font-black">BKSP</kbd>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Reject</span>
              </div>
            </div>
          )}
        </div>

        {isPhase1 && currentWordIndex < 15 && (
          <div className="absolute top-12 left-12 bg-black/90 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-emerald-500/30 text-left animate-in fade-in slide-in-from-left-4 duration-1000 z-[100] shadow-2xl max-w-[320px]">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-5">
              <MousePointer2 className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-2">Initialize Capture</h5>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] leading-relaxed">
              Read the anchor script clearly. While reading, use the widget below or [ENTER] to capture each card. Final reading will synthesize after Node 13.
            </p>
          </div>
        )}
      </div>

      <div className="teleprompter-controls flex flex-col gap-8 py-12 px-16">
        {isPhase1 && (
          <div className="w-full max-w-6xl mx-auto mb-4">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Matrix Saturation Status</span>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 tabular-nums">{capturedCards.length} / 13 NODES VERIFIED</span>
            </div>
            <div className="flex justify-center gap-3">
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${capturedCards[i] ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/5 border border-white/5'}`} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between w-full gap-20">
          <div className="flex-1 flex flex-col gap-5">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-gold-accent opacity-30" />
                <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-30">Velocity</span>
              </div>
              <span className="text-[14px] font-black text-white tabular-nums tracking-widest">{scrollSpeed} WPM</span>
            </div>
            <div className="relative h-14 flex items-center bg-white/[0.03] px-6 rounded-2xl border border-white/5 shadow-inner">
              <input 
                type="range" min="40" max="450" step="5" value={scrollSpeed} 
                onChange={(e) => setScrollSpeed(parseInt(e.target.value))} 
                className="control-slider w-full accent-gold-accent cursor-pointer"
                disabled={voiceTracking}
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={() => {
                isAutoScrollingRef.current = false;
                setCurrentWordIndex(0);
              }} 
              className="p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all shadow-xl group"
              title="Reset Sequence"
            >
              <RotateCcw className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
            </button>

            <button 
              onClick={() => setIsSmartScroll(!isSmartScroll)} 
              className={`flex flex-col items-center gap-3 p-6 min-w-[100px] rounded-2xl transition-all duration-500 border-2 shadow-2xl ${isSmartScroll ? 'bg-gold-accent/20 border-gold-accent/50 text-gold-accent' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'}`}
              title="Toggle Pacing Intelligence"
            >
              <BrainCircuit className="w-6 h-6" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Smart</span>
            </button>

            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-110 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isPaused ? 'bg-gold-accent text-black rotate-[360deg]' : 'bg-white text-black'}`}
              title="Toggle Sequence [SPACE]"
            >
              {isPaused ? <Play className="w-12 h-12 ml-2" /> : <Pause className="w-12 h-12" />}
              {!isPaused && (
                <div className="absolute -inset-4 border-2 border-white/20 rounded-full animate-ping pointer-events-none" />
              )}
            </button>

            <button 
              onClick={toggleVoiceTracking}
              className={`flex flex-col items-center gap-3 p-6 min-w-[100px] rounded-2xl transition-all duration-500 border-2 shadow-2xl ${voiceTracking ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'}`}
              title="Toggle Acoustic Following [V]"
            >
              {voiceTracking ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Voice</span>
            </button>
          </div>

          <div className="flex-1 flex items-center gap-12 justify-end">
            <div className="flex flex-col gap-5 w-64">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-3">
                  <Type className="w-4 h-4 text-gold-accent opacity-30" />
                  <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-30">Scaling</span>
                </div>
                <span className="text-[14px] font-black text-white tabular-nums tracking-widest">{fontSize} PX</span>
              </div>
              <div className="relative h-14 flex items-center bg-white/[0.03] px-6 rounded-2xl border border-white/5 shadow-inner">
                <input 
                  type="range" min="16" max="140" step="2" value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))} 
                  className="control-slider w-full accent-gold-accent cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsMirror(!isMirror)} 
                className={`p-7 rounded-2xl transition-all duration-500 border-2 flex flex-col items-center gap-3 shadow-2xl ${isMirror ? 'bg-gold-accent text-black border-gold-accent' : 'bg-white/5 text-white/30 border-white/5'}`}
                title="Mirror Layout [M]"
              >
                <FlipHorizontal className="w-8 h-8" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Mirror</span>
              </button>

              {isPhase1 && (
                <div className="border-l border-white/10 pl-10 ml-6">
                  <CardCaptureWidget 
                    compact 
                    capturedCards={capturedCards} 
                    onCardCaptured={handleCardCaptured}
                    onReset={handleReset}
                    pendingCard={pendingCard}
                    setPendingCard={setPendingCard}
                    {...speech}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeleprompterModal;
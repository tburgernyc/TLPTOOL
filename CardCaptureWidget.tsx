import React, { useState, useCallback, useEffect } from 'react';
import { getFlatCardDatabase } from './tarotCardDatabase';
import { parseCardFromSpeech } from './cardMatcher';
import { Check, X, Target, Activity } from 'lucide-react';

interface CardCaptureWidgetProps {
  onCardCaptured: (card: { name: string; orientation: 'Upright' | 'Reversed' }, allCards: any[]) => void;
  capturedCards: any[];
  onReset: () => void;
  compact?: boolean;
  // Prop-drilled speech states to avoid multiple mic instances
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  volume: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  error?: string | null;
  subscribeToVolume?: (callback: (volume: number) => void) => () => void;
  // Externalized state for keyboard shortcuts
  pendingCard: any;
  setPendingCard: (val: any) => void;
}

const CardCaptureWidget: React.FC<CardCaptureWidgetProps> = ({ 
  onCardCaptured, 
  capturedCards, 
  onReset, 
  compact,
  isListening,
  transcript,
  interimTranscript,
  volume,
  start,
  stop,
  reset,
  error,
  pendingCard,
  setPendingCard,
  subscribeToVolume
}) => {
  const [listeningStatus, setListeningStatus] = useState('');
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    if (subscribeToVolume) {
      return subscribeToVolume(setLocalVolume);
    } else {
      setLocalVolume(volume);
    }
  }, [subscribeToVolume, volume]);
  
  // Use a local "session transcript" to detect new matches within one card capture cycle
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');

  useEffect(() => {
    if (isListening && !pendingCard) {
      const fullText = (transcript + ' ' + interimTranscript).trim();
      
      // Only process if the transcript has changed significantly
      if (fullText && fullText !== lastProcessedTranscript) {
        const timeoutId = setTimeout(() => {
          setListeningStatus('Scanning...');
          const parsed = parseCardFromSpeech(fullText, getFlatCardDatabase());

          if (parsed.success) {
            setPendingCard(parsed);
            setListeningStatus(parsed.card.name);
            setLastProcessedTranscript(fullText);
          }
        }, 500);
        
        return () => clearTimeout(timeoutId);
      } else if (!fullText) {
        setListeningStatus('Awaiting Node...');
      }
    }
  }, [transcript, interimTranscript, isListening, pendingCard, lastProcessedTranscript, setPendingCard]);

  const handleConfirm = useCallback(() => {
    if (pendingCard) {
      onCardCaptured(pendingCard.card, [...capturedCards, pendingCard.card]);
      setPendingCard(null);
      setListeningStatus('Node Captured');
      setLastProcessedTranscript('');
      reset(); // Clear transcript for the next card
    }
  }, [pendingCard, onCardCaptured, capturedCards, reset, setPendingCard]);

  const handleReject = useCallback(() => {
    setPendingCard(null);
    setListeningStatus('Retrying...');
    setLastProcessedTranscript('');
    reset(); // Clear transcript to retry
  }, [reset, setPendingCard]);

  const getConfidenceTextColor = (conf: any) => {
    if (conf === 'High') return 'text-emerald-400';
    if (conf === 'Medium') return 'text-amber-400';
    return 'text-rose-400';
  };

  const getConfidenceBg = (conf: any) => {
    if (conf === 'High') return 'bg-emerald-500/20 border-emerald-500/40';
    if (conf === 'Medium') return 'bg-amber-500/20 border-amber-500/40';
    return 'bg-rose-500/20 border-rose-500/40';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-6">
        {error && (
          <div className="flex items-center gap-2 text-rose-500 animate-pulse">
            <X className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mic Error</span>
          </div>
        )}

        {pendingCard ? (
          <div className={`flex items-center gap-5 border px-6 py-2.5 rounded-2xl animate-in zoom-in duration-300 shadow-2xl ${getConfidenceBg(pendingCard.confidenceCategory)}`}>
             <div className="flex flex-col min-w-[120px]">
                <span className="text-[11px] font-black text-white leading-none uppercase tracking-tighter whitespace-nowrap">{pendingCard.card.name}</span>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${getConfidenceTextColor(pendingCard.confidenceCategory)}`}>
                  {pendingCard.confidenceCategory} Confidence ({pendingCard.confidence}%)
                </span>
             </div>
             <div className="flex gap-2 border-l border-white/10 pl-5">
                <button 
                  onClick={handleConfirm} 
                  className="p-2.5 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  title="Confirm [ENTER]"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleReject} 
                  className="p-2.5 bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl hover:bg-rose-500/30 transition-all"
                  title="Reject [BACKSPACE]"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="relative">
              <button 
                onClick={isListening ? stop : start} 
                disabled={capturedCards.length >= 13}
                aria-label={isListening ? "Stop Scanning" : "Initialize Capture"}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  isListening 
                  ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-gold-accent hover:text-gold-accent hover:scale-105'
                }`}
              >
                {isListening ? <Activity className="w-6 h-6 animate-pulse" /> : <Target className="w-6 h-6" />}
              </button>
              
              {isListening && (
                <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-6 h-6 bg-black rounded-full border border-white/10 overflow-hidden">
                   <div className="w-1 bg-emerald-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, localVolume / 4)}px` }} />
                </div>
              )}
            </div>

            {isListening && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">
                  Listening Protocol
                </span>
                <span className="text-[12px] font-black text-white uppercase tracking-widest truncate max-w-[160px]">
                  {listeningStatus}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 neo-3d-card border-emerald-500/20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Node Logic</h4>
          <p className="text-[8px] font-bold text-taupe-accent/40 uppercase tracking-[0.2em]">Calibration Active</p>
        </div>
        <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[12px] font-black text-emerald-500">
          {capturedCards.length}/13
        </div>
      </div>
      
      <button 
        onClick={isListening ? stop : start} 
        className={`w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] transition-all duration-500 flex items-center justify-center gap-4 ${
          isListening 
          ? 'bg-emerald-500 text-black border-emerald-400' 
          : 'neo-3d-button !text-white'
        }`}
      >
        {isListening ? <Activity className="w-5 h-5 animate-pulse" /> : <Target className="w-5 h-5" />}
        <span>{isListening ? 'Stop Scanning' : 'Initialize Capture'}</span>
      </button>
    </div>
  );
};

export default CardCaptureWidget;
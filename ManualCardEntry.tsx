import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { TarotCard, Spread, SpreadPreset } from './types';
import { RotateCw, Search, CheckCircle2, AlertCircle, Mic, MicOff, Save, FolderOpen, Trash2, Layout } from 'lucide-react';
import { flatCardDatabase } from './tarotCardDatabase';
import { findCardMatch, parseCardFromSpeech } from './cardMatcher';
import { useSpeechRecognition } from './useSpeechRecognition';

interface ManualCardEntryProps {
  spread: Spread;
  onChange: (newSpread: Spread) => void;
}

interface CardInputProps {
  section: keyof Spread;
  index: number | null;
  card: TarotCard;
  label: string;
  onUpdate: (section: keyof Spread, index: number | null, updates: Partial<TarotCard>) => void;
}

const digitToWord = (text: string): string => {
  const map: { [key: string]: string } = {
    '1': 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten'
  };

  let processed = text;
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  keys.forEach(num => {
    const regex = new RegExp(`\\b${num}\\b`, 'g');
    processed = processed.replace(regex, map[num]);
  });

  return processed;
};

const CardInput: React.FC<CardInputProps> = ({ 
  section, 
  index, 
  card, 
  label,
  onUpdate
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  
  const { isListening, transcript, interimTranscript, start, stop } = useSpeechRecognition();

  useEffect(() => {
    if (isRecognizing && isListening) {
      const fullText = (transcript + ' ' + interimTranscript).trim();
      if (fullText) {
        const result = parseCardFromSpeech(fullText, flatCardDatabase);
        setMatchResult(result);
        if (result.success && result.card) {
          onUpdate(section, index, { 
            name: result.card.name, 
            orientation: result.card.orientation 
          });
          if (result.confidenceCategory === 'High') {
            handleStopMic();
          }
        }
      }
    }
  }, [transcript, interimTranscript, isRecognizing, isListening, onUpdate, section, index]);

  const handleStartMic = () => {
    setIsRecognizing(true);
    setMatchResult(null);
    start();
  };

  const handleStopMic = () => {
    setIsRecognizing(false);
    stop();
  };

  const validation = useMemo(() => {
    if (!card.name.trim()) return { status: 'empty', match: null };
    const match = findCardMatch(card.name, flatCardDatabase);
    if (match.card && match.confidence >= 80) {
      return { status: 'valid', match: match.card };
    }
    return { status: 'invalid', match: null };
  }, [card.name]);

  const getConfidenceColor = (cat?: string) => {
    if (cat === 'High') return 'text-emerald-500';
    if (cat === 'Medium') return 'text-amber-500';
    if (cat === 'Low') return 'text-rose-400';
    return 'text-slate-500';
  };

  return (
    <div className="neo-3d-card p-6 rounded-[2rem] flex flex-col gap-5 group transition-all duration-500 hover:scale-[1.05] relative overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
        validation.status === 'valid' ? 'bg-emerald-500/[0.03]' : 
        validation.status === 'invalid' ? 'bg-rose-500/[0.02]' : 'bg-white/[0.01]'
      }`} />
      
      <div className="flex items-center justify-between ml-1 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-taupe-accent/60">{label}</span>
        <div className={`w-2 h-2 rounded-full transition-all duration-500 shadow-inner ${
          validation.status === 'valid' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
          validation.status === 'invalid' ? 'bg-amber-500' : 'bg-slate-900'
        }`} />
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        <div className="relative group/input">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-20">
            {validation.status === 'valid' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />
            ) : validation.status === 'invalid' ? (
              <AlertCircle className="w-4 h-4 text-amber-500/60" />
            ) : (
              <Search className={`w-3.5 h-3.5 transition-colors ${isFocused ? 'text-taupe-accent' : 'text-slate-700'}`} />
            )}
          </div>
          
          <input
            type="text"
            placeholder="TYPE CARD NAME..."
            value={card.name}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              const transformedValue = digitToWord(e.target.value);
              onUpdate(section, index, { name: transformedValue });
            }}
            className={`w-full neo-3d-input rounded-xl pl-12 pr-14 py-4 text-[10px] font-black tracking-widest focus:outline-none transition-all text-white/90 bg-transparent placeholder:text-slate-800 ${
              validation.status === 'valid' ? 'border-emerald-500/30 !shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' :
              validation.status === 'invalid' ? 'border-amber-500/20' : ''
            }`}
          />
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-30">
            <button
              type="button"
              onClick={isRecognizing ? handleStopMic : handleStartMic}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isRecognizing 
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse' 
                  : 'text-slate-700 hover:text-taupe-accent hover:bg-white/5'
              }`}
            >
              {isRecognizing ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="h-6 px-2">
          {isRecognizing && (
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-emerald-500/80 uppercase tracking-widest animate-pulse">
                Listening... {interimTranscript && `"${interimTranscript}"`}
              </p>
              {matchResult?.success && (
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${getConfidenceColor(matchResult.confidenceCategory)}`}>
                  {matchResult.confidenceCategory} Confidence: {matchResult.card.name} ({matchResult.confidence}%)
                </p>
              )}
            </div>
          )}
          {!isRecognizing && validation.status === 'invalid' && card.name && (
            <p className="text-[8px] font-bold text-amber-500/60 uppercase tracking-widest animate-in fade-in">
              Unrecognized Node. Manual verification required.
            </p>
          )}
          {!isRecognizing && validation.status === 'valid' && (
            <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em] animate-in fade-in">
              Node Verified Protocol
            </p>
          )}
        </div>
        
        <button
          onClick={() => onUpdate(section, index, { orientation: card.orientation === 'Upright' ? 'Reversed' : 'Upright' })}
          className={`w-full py-4 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center gap-4 ${
            card.orientation === 'Reversed' 
              ? 'neo-3d-input text-rose-400' 
              : 'neo-3d-button text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.1)]'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 transition-transform duration-1000 ${card.orientation === 'Reversed' ? 'rotate-180' : ''}`} />
          <span>{card.orientation.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};

const ManualCardEntry: React.FC<ManualCardEntryProps> = ({ spread, onChange }) => {
  const [presets, setPresets] = useState<SpreadPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tlp_spread_presets');
    if (saved) setPresets(JSON.parse(saved));
  }, []);

  const savePresets = (updated: SpreadPreset[]) => {
    setPresets(updated);
    localStorage.setItem('tlp_spread_presets', JSON.stringify(updated));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const preset: SpreadPreset = {
      id: crypto.randomUUID(),
      name: newPresetName,
      spread: JSON.parse(JSON.stringify(spread)),
      createdAt: Date.now()
    };
    savePresets([preset, ...presets]);
    setNewPresetName('');
  };

  const updateCard = useCallback((
    section: keyof Spread,
    index: number | null,
    updates: Partial<TarotCard>
  ) => {
    const newSpread = { ...spread };
    if (section === 'bottom') {
      newSpread.bottom = { ...newSpread.bottom, ...updates };
    } else {
      const arr = [...(newSpread[section] as TarotCard[])];
      if (index !== null) {
        arr[index] = { ...arr[index], ...updates };
        (newSpread[section] as TarotCard[]) = arr;
      }
    }
    onChange(newSpread);
  }, [spread, onChange]);

  const SectionHeader = ({ label, colorClass = "bg-taupe-accent" }: { label: string, colorClass?: string }) => (
    <div className="flex items-center gap-4 px-2 mb-10 group">
      <div className={`w-2 h-2 rounded-full ${colorClass} shadow-[0_0_15px_rgba(155,155,155,0.4)]`} />
      <h4 className="text-[12px] font-black text-white uppercase tracking-[0.5em] opacity-80">{label}</h4>
      <div className="flex-1 h-px bg-gradient-to-r from-white/[0.05] to-transparent ml-4" />
    </div>
  );

  return (
    <div className="space-y-16 animate-fade-in-up">
      <section className="neo-3d-card p-10 space-y-8 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Layout className="w-5 h-5 text-taupe-accent" />
            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Node Presets</h3>
          </div>
          <button onClick={() => setShowPresets(!showPresets)} className="text-[10px] font-black uppercase tracking-widest text-taupe-accent hover:text-white transition-colors flex items-center gap-2">
            {showPresets ? 'Close Archive' : 'Open Archive'} <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-4">
          <input type="text" placeholder="PRESET NAME..." value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="flex-1 neo-3d-input px-6 py-4 text-[10px] font-black tracking-widest uppercase text-white" />
          <button onClick={handleSavePreset} disabled={!newPresetName.trim()} className="px-8 py-4 neo-3d-button !text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-30">
            <Save className="w-3.5 h-3.5" /> Record
          </button>
        </div>
        {showPresets && presets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-in fade-in slide-in-from-top-4">
            {presets.map(p => (
              <div key={p.id} className="neo-3d-input p-5 flex items-center justify-between group/preset">
                <button onClick={() => onChange(p.spread)} className="flex-1 text-left">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest group-hover/preset:text-taupe-accent transition-colors">{p.name}</p>
                </button>
                <button
                  onClick={() => savePresets(presets.filter(pr => pr.id !== p.id))}
                  className="p-2 text-slate-800 hover:text-rose-500 transition-colors"
                  aria-label={`Delete preset ${p.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {[
          { key: 'situation', label: 'THE SITUATION' },
          { key: 'feelings', label: 'THE DEPTHS' },
          { key: 'message', label: 'THE GUIDANCE' },
          { key: 'outcome', label: 'THE VECTOR' }
        ].map((sec) => (
          <div key={sec.key} className="space-y-8">
            <SectionHeader label={sec.label} />
            <div className="space-y-8">
              {(spread[sec.key as keyof Spread] as TarotCard[]).map((c, i) => (
                <CardInput key={`${sec.key}-${i}`} section={sec.key as keyof Spread} index={i} card={c} label={`NODE 0${i+1}`} onUpdate={updateCard} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center pt-10">
        <div className="w-full max-w-sm space-y-10">
          <SectionHeader label="THE SUBCONSCIOUS" />
          <CardInput section="bottom" index={null} card={spread.bottom} label="SHADOW BASE" onUpdate={updateCard} />
        </div>
      </div>
    </div>
  );
};

export default ManualCardEntry;
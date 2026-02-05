import React, { useState, useMemo } from 'react';
import { GeneratedReading, ReadingMode, Spread } from './types';
import { Copy, Download, Check, Type, Tv, Activity } from 'lucide-react';
import TeleprompterModal from './TeleprompterModal';
import AudioPlayer from './AudioPlayer';

interface ScriptViewerProps {
  reading: GeneratedReading;
  onPart2Generated?: (reading: GeneratedReading) => void;
  isGeneratingAudio?: boolean;
  shouldAutoPlay?: boolean;
  onAutoPlayComplete?: () => void;
}

const ScriptViewer: React.FC<ScriptViewerProps> = ({ reading, onPart2Generated, isGeneratingAudio, shouldAutoPlay, onAutoPlayComplete }) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reading.fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([reading.fullScript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    const timeframe = reading.params.startDate === reading.params.endDate ? reading.params.startDate : `${reading.params.startDate}_to_${reading.params.endDate}`;
    element.download = `TLP_${reading.params.sign}_${timeframe}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isManualTwoPart = reading.params.mode === ReadingMode.MANUAL_COLLECTIVE || reading.params.mode === ReadingMode.MANUAL_SPECIFIC;
  const isOnlyPhase1 = isManualTwoPart && !reading.readingBody;

  const parsedScriptElements = useMemo(() => {
    return reading.fullScript.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-8" />;

      const isPauseLine = line.includes('[PAUSE]');

      return (
        <p
          key={i}
          className={`mb-12 transition-all hover:text-white duration-500 ${isPauseLine ? 'border-l-2 border-gold-accent/10 pl-10' : ''}`}
        >
          {line.split(/(\[PAUSE\]|\[EMPHASIS\])/g).map((part, index) => {
            if (part === '[PAUSE]') {
              return (
                <span key={index} className="bg-white/5 border border-white/10 text-taupe-accent px-3 py-1 font-sans text-[10px] font-black uppercase tracking-[0.2em] rounded-lg mx-1 align-middle inline-block">
                  PAUSE
                </span>
              );
            }
            if (part === '[EMPHASIS]') {
              return (
                <span key={index} className="bg-gold-accent/10 border border-gold-accent/20 text-gold-accent px-3 py-1 font-sans text-[10px] font-black uppercase tracking-[0.2em] rounded-lg mx-1 align-middle italic inline-block">
                  STRESS
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  }, [reading.fullScript]);

  return (
    <div className="space-y-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.03] pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnlyPhase1 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]'} animate-pulse`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${isOnlyPhase1 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {isOnlyPhase1 ? 'STAGE 01 PROTOCOL' : 'TRANSMISSION STABLE'}
            </span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Teleprompter Master</h2>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            Timeframe: {reading.params.startDate} — {reading.params.endDate} • UNITS: {reading.wordCount}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTeleprompter(true)}
            className="flex items-center gap-3 px-10 py-4 neo-3d-button !bg-taupe-accent/20 !text-taupe-accent border-taupe-accent/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:!bg-taupe-accent/30 transition-all group"
          >
            <Tv className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {isOnlyPhase1 ? 'Live Node Capture' : 'Initiate Broadcast'}
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-500 ${copied ? 'neo-3d-input text-emerald-400' : 'neo-3d-button !text-white'
              }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Sync Clipboard'}
          </button>
        </div>
      </div>

      {/* Enhanced Vocal Synthesis Layer */}
      {isGeneratingAudio && !reading.audioData && (
        <div className="neo-3d-card p-10 border border-gold-accent/10 relative overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-gold-accent/10 flex items-center justify-center animate-pulse">
              <Activity className="w-6 h-6 text-gold-accent" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Generating Vocal Synthesis</h4>
              <p className="text-[9px] font-bold text-gold-accent/50 uppercase tracking-widest mt-1">Processing audio stream...</p>
            </div>
          </div>
        </div>
      )}
      {reading.audioData && (
        <AudioPlayer
          audioData={reading.audioData}
          autoPlay={shouldAutoPlay}
          onAutoPlayComplete={onAutoPlayComplete}
        />
      )}

      {/* Professional Script Interface */}
      <div className="neo-3d-card p-1 shadow-2xl overflow-hidden relative">
        <div className="bg-[#0D0D0F] rounded-[2.3rem] p-12 md:p-24 script-font max-h-[900px] overflow-y-auto leading-relaxed relative border border-white/[0.02]">
          <div className="absolute top-10 right-10 text-[8px] font-black text-white/10 tracking-[0.6em] uppercase">TLP // ARCHIVE_01</div>

          <div className="text-center mb-20 opacity-30 text-[10px] uppercase font-black tracking-[1em] text-taupe-accent flex items-center justify-center gap-10">
            <div className="h-px w-20 bg-current" />
            START TRANSMISSION
            <div className="h-px w-20 bg-current" />
          </div>

          <div
            className="whitespace-pre-wrap text-[#D1D1D1] transition-all duration-300"
            style={{ fontSize: `${fontSize}px` }}
          >
            {parsedScriptElements}
          </div>

          {isOnlyPhase1 && (
            <div className="p-16 neo-3d-input border-dashed border-amber-500/20 text-center space-y-6 bg-amber-500/[0.02]">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-500">Capture Matrix Required</p>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-lg mx-auto">
                  Stage 01 Anchor finalized. Open teleprompter to capture all 13 nodes and synthesize the narrative arc.
                </p>
              </div>
            </div>
          )}

          <div className="mt-24 pt-16 border-t border-white/[0.05] text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.8em]">
            END OF BROADCAST RECORD
          </div>
        </div>
      </div>

      {showTeleprompter && (
        <TeleprompterModal
          script={reading.fullScript}
          onClose={() => setShowTeleprompter(false)}
          isPhase1={isOnlyPhase1}
          initialParams={reading.params}
          astrologyData={reading.astrology}
          onPart2Generated={(fullScript, capturedSpread) => {
            if (onPart2Generated) {
              const updatedReading = {
                ...reading,
                fullScript,
                spread: capturedSpread || reading.spread,
                readingBody: fullScript.replace(reading.introText || '', '').trim(),
                wordCount: fullScript.split(/\s+/).length
              };
              onPart2Generated(updatedReading);
            }
          }}
        />
      )}
    </div>
  );
};

export default ScriptViewer;

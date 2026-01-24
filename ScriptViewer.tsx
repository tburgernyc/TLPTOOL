import React, { useState, useRef, useEffect } from 'react';
import { GeneratedReading, ReadingMode, Spread } from '../types';
import { Copy, Download, Check, Type, Tv, Play, Pause, Volume2, Activity, Music, Sparkles } from 'lucide-react';
import TeleprompterModal from './Teleprompter/TeleprompterModal';

interface ScriptViewerProps {
  reading: GeneratedReading;
  onPart2Generated?: (reading: GeneratedReading) => void;
}

const ScriptViewer: React.FC<ScriptViewerProps> = ({ reading, onPart2Generated }) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(reading.fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([reading.fullScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const timeframe = reading.params.startDate === reading.params.endDate ? reading.params.startDate : `${reading.params.startDate}_to_${reading.params.endDate}`;
    element.download = `TLP_${reading.params.sign}_${timeframe}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current?.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.1)');
        gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.5)');
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0.8)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    renderFrame();
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentTime(0);
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!reading.audioData) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBytes = decodeBase64(reading.audioData);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      
      setDuration(audioBuffer.duration);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 128; // Smaller for cleaner visual bars
      analyserRef.current = analyser;

      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(100);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
      
      audioSourceRef.current = source;
      startTimeRef.current = audioContextRef.current.currentTime;
      source.start();
      setIsPlaying(true);
      drawVisualizer();

      progressIntervalRef.current = window.setInterval(() => {
        if (audioContextRef.current) {
          const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
          const prog = Math.min((elapsed / audioBuffer.duration) * 100, 100);
          setPlaybackProgress(prog);
          setCurrentTime(elapsed);
          if (prog >= 100) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          }
        }
      }, 50); // Faster updates for smoother UI

    } catch (e) {
      console.error("Vocal Synthesis Playback Fault:", e);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isManualTwoPart = reading.params.mode === ReadingMode.MANUAL_COLLECTIVE || reading.params.mode === ReadingMode.MANUAL_SPECIFIC;
  const isOnlyPhase1 = isManualTwoPart && !reading.readingBody;

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
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-500 ${
              copied ? 'neo-3d-input text-emerald-400' : 'neo-3d-button !text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Sync Clipboard'}
          </button>
        </div>
      </div>

      {/* Enhanced Vocal Synthesis Layer */}
      {reading.audioData && (
        <div className="neo-3d-card p-10 border border-gold-accent/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gold-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="relative w-28 h-28">
              {/* Circular Progress Ring */}
              <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="52"
                  fill="none"
                  stroke="rgba(212, 175, 55, 0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="52"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - playbackProgress / 100)}`}
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              
              <button 
                onClick={handlePlayAudio}
                aria-label={isPlaying ? "Pause audio synthesis" : "Play audio synthesis"}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl ${
                  isPlaying 
                  ? 'bg-gold-accent text-black scale-105 shadow-gold-accent/40' 
                  : 'bg-white/5 text-gold-accent border border-gold-accent/30 hover:bg-gold-accent/10'
                }`}
              >
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
              </button>
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-xl transition-all duration-1000 ${isPlaying ? 'bg-gold-accent text-black animate-pulse' : 'bg-gold-accent/10 text-gold-accent'}`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Acoustic Logic Module</h4>
                    <p className="text-[9px] font-bold text-gold-accent/50 uppercase tracking-widest mt-1">Grounded Tim B. V3.8 Synthesis</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-black text-white/50 uppercase tracking-widest tabular-nums bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                  <span className={isPlaying ? 'text-white' : ''}>{formatTime(currentTime)}</span>
                  <span className="opacity-20">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="relative h-24 w-full neo-3d-input overflow-hidden rounded-2xl flex items-center bg-black/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] border border-white/5">
                <canvas 
                  ref={canvasRef} 
                  width={1200} 
                  height={96} 
                  className="w-full h-full opacity-80 pointer-events-none"
                />
                
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-4 opacity-10">
                      <Music className="w-4 h-4" />
                      <p className="text-[10px] font-black text-white uppercase tracking-[1em]">Awaiting Acoustic Protocol</p>
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
            {reading.fullScript.split('\n').map((line, i) => {
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
            })}
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
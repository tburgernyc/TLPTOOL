import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Activity, Music, Sparkles } from 'lucide-react';

interface AudioPlayerProps {
  audioData: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioData }) => {
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

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Fallback: Manual PCM decoding if native method fails
  const manualDecodePCM = (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): AudioBuffer => {
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

  // Helper to create a minimal WAV header for raw PCM data
  const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitDepth: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    return buffer;
  };

  const robustDecodeAudio = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> => {
    // 1. Sniff for existing container (RIFF/WAV, ID3/MP3, Ogg, etc.)
    // Simple check: 'RIFF' at start or 'ID3' or sync words.
    // If it looks like a container, try native decode immediately.
    const isContainer =
      (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) || // RIFF
      (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) || // ID3
      (data[0] === 0xFF && (data[1] & 0xE0) === 0xE0); // MP3 Frame Sync (approx)

    // Helper to handle decodeAudioData promise/callback compat
    const decodeCompat = (buffer: ArrayBuffer): Promise<AudioBuffer> => {
      return new Promise((resolve, reject) => {
        try {
          const res = ctx.decodeAudioData(buffer, resolve, reject);
          // If it returns a promise (modern browsers), wait for it
          if (res && typeof res.then === 'function') {
            res.then(resolve).catch(reject);
          }
        } catch (e) {
          reject(e);
        }
      });
    };

    if (isContainer) {
      try {
        // Copy data to ensure ArrayBuffer compatibility
        const bufferCopy = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        return await decodeCompat(bufferCopy);
      } catch (e) {
        console.warn("Container decode failed, falling back...", e);
      }
    }

    // 2. Wrap raw PCM in WAV header and try native decode
    try {
      const header = createWavHeader(data.length, sampleRate, numChannels, 16);
      const wavBuffer = new Uint8Array(header.byteLength + data.length);
      wavBuffer.set(new Uint8Array(header), 0);
      wavBuffer.set(data, header.byteLength);

      return await decodeCompat(wavBuffer.buffer);
    } catch (e) {
      console.warn("WAV-wrap decode failed, falling back to manual loop.", e);
    }

    // 3. Fallback: Manual PCM loop
    return manualDecodePCM(data, ctx, sampleRate, numChannels);
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

    if (!audioData) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBytes = decodeBase64(audioData);
      // Try robust native decode, with manual fallback
      const audioBuffer = await robustDecodeAudio(audioBytes, audioContextRef.current, 24000, 1);

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
    return () => {
      stopAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
  );
};

export default AudioPlayer;

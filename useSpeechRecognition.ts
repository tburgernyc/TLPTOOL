import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  volume: number; // 0 to 100
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}

interface UseSpeechRecognitionOptions {
  enableVolumeMeter?: boolean;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const { enableVolumeMeter = true } = options;

  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  const startVolumeAnalysis = async () => {
    if (!enableVolumeMeter) return;

    try {
      if (audioContextRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastVolumeUpdate = 0;
      const VOLUME_THROTTLE_MS = 50;

      const updateVolume = () => {
        if (!analyserRef.current || !isListeningRef.current) {
          setVolume(0);
          return;
        }

        const now = Date.now();
        if (now - lastVolumeUpdate > VOLUME_THROTTLE_MS) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setVolume(Math.min(average * 2.5, 100)); // Normalized
          lastVolumeUpdate = now;
        }

        if (isListeningRef.current) requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.warn('Volume analysis initialization failed', err);
    }
  };

  const stopVolumeAnalysis = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolume(0);
  };

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    isListeningRef.current = false;
    stopVolumeAnalysis();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser.');
      return;
    }

    // Clean up existing instance before starting new one
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    shouldRestartRef.current = true;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
      startVolumeAnalysis();
    };

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setTranscript(prev => (prev + ' ' + final).trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      
      console.error('Speech Recognition Error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please check site permissions.');
        shouldRestartRef.current = false;
        setIsListening(false);
        isListeningRef.current = false;
        stopVolumeAnalysis();
      } else {
        setError(`System encountered a speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        // Delay restart slightly to allow browser to clear previous session
        restartTimeoutRef.current = window.setTimeout(() => {
          if (shouldRestartRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Auto-restart failed', e);
              setIsListening(false);
              isListeningRef.current = false;
              stopVolumeAnalysis();
            }
          }
        }, 300);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
        stopVolumeAnalysis();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setError('Failed to initiate microphone protocol.');
    }
  }, []);

  useEffect(() => {
    // Sync ref with state for completeness
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      stopVolumeAnalysis();
    };
  }, []);

  return { isListening, transcript, interimTranscript, volume, start, stop, reset, error };
};
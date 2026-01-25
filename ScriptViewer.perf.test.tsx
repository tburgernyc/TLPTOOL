import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { Profiler } from 'react';
import ScriptViewer from './ScriptViewer';
import { GeneratedReading, ReadingMode, ReadingLength } from './types';
import '@testing-library/jest-dom';

// Mock AudioContext and related web audio API
class MockAudioContext {
  state = 'suspended';
  currentTime = 0;
  createBuffer = vi.fn(() => ({
    duration: 10,
    getChannelData: vi.fn(() => new Float32Array(100)),
  }));
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  }));
  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    getByteFrequencyData: vi.fn(),
  }));
  resume = vi.fn(async () => { this.state = 'running'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  destination = {};

  constructor() {
      // Capture instance
  }
}

// Mock Canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
  fillRect: vi.fn(),
} as any));

// Mock window.URL
window.URL.createObjectURL = vi.fn();

const DUMMY_AUDIO = 'UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';

const mockReading: GeneratedReading = {
  id: '123',
  params: {
    sign: 'Aries',
    mode: ReadingMode.COLLECTIVE,
    topic: 'General',
    startDate: '2023-01-01',
    endDate: '2023-01-07',
    length: ReadingLength.MEDIUM,
    includeAudio: true,
  },
  astrology: {
    moonPhase: 'Full',
    transits: [],
    retrogrades: [],
    theme: 'Change',
    details: 'Details',
  },
  spread: {
    situation: [],
    feelings: [],
    message: [],
    outcome: [],
    bottom: { name: 'The Fool', orientation: 'Upright', imageUrl: '' },
  },
  hook: 'Hook',
  fullScript: 'Line 1\nLine 2\n[PAUSE]Line 3',
  wordCount: 100,
  createdAt: 1234567890,
  audioData: DUMMY_AUDIO,
};

describe('ScriptViewer Performance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.AudioContext = MockAudioContext as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ScriptViewer does NOT re-render repeatedly during audio playback', async () => {
    // We intercept AudioContext to drive time
    let audioContextInstance: any;
    const OriginalMock = window.AudioContext;
    window.AudioContext = class extends (OriginalMock as any) {
        constructor(opts: any) {
            super(opts);
            audioContextInstance = this;
        }
    } as any;

    // Proxy the reading object to track property access
    // If ScriptViewer re-renders, it accesses reading.fullScript for useMemo dependencies
    let scriptAccessCount = 0;
    const proxiedReading = new Proxy(mockReading, {
        get(target, prop, receiver) {
            if (prop === 'fullScript') {
                scriptAccessCount++;
            }
            return Reflect.get(target, prop, receiver);
        }
    });

    render(<ScriptViewer reading={proxiedReading} />);

    // Initial render
    expect(scriptAccessCount).toBeGreaterThan(0);

    // Click play
    const playButton = screen.getByLabelText('Play audio synthesis');
    fireEvent.click(playButton);

    await act(async () => {
        await Promise.resolve();
    });

    // Capture access count before ticking
    const accessCountAfterPlay = scriptAccessCount;

    // Simulate 10 ticks (500ms)
    for (let i = 0; i < 10; i++) {
        await act(async () => {
            if (audioContextInstance) {
                audioContextInstance.currentTime += 0.05;
            }
            vi.advanceTimersByTime(50);
        });
    }

    // Key Assertion:
    // The number of accesses should NOT increase during the ticks.
    expect(scriptAccessCount).toBe(accessCountAfterPlay);

    // Also verify that the time is actually updating in the DOM (AudioPlayer is working)
    // Tick 20 more times -> +1.0s -> total 1.5s -> 0:01.
    for (let i = 0; i < 20; i++) {
        await act(async () => {
             if (audioContextInstance) {
                audioContextInstance.currentTime += 0.05;
            }
            vi.advanceTimersByTime(50);
        });
    }

    // Check if time updated in DOM
    // "0:01" should appear
    expect(screen.getByText('0:01')).toBeInTheDocument();

    // And ScriptViewer still shouldn't have re-rendered
    expect(scriptAccessCount).toBe(accessCountAfterPlay);
  });
});

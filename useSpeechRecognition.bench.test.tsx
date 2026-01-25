import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSpeechRecognition } from './useSpeechRecognition';

// Mock Web Audio API
const mockGetByteFrequencyData = vi.fn();
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockStopTrack = vi.fn();

// Mock MediaStream and AudioContext
const setupMocks = () => {
  const MockAudioContext = vi.fn(function() {
      this.createMediaStreamSource = vi.fn().mockReturnValue({
          connect: vi.fn(),
      });
      this.createAnalyser = vi.fn().mockReturnValue({
          fftSize: 256,
          frequencyBinCount: 128,
          getByteFrequencyData: mockGetByteFrequencyData,
          connect: vi.fn(),
      });
      this.close = mockClose;
      this.state = 'running';
  });
  window.AudioContext = MockAudioContext as any;
  (window as any).webkitAudioContext = MockAudioContext;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: mockStopTrack }],
      }),
    },
    writable: true,
  });

  // Mock SpeechRecognition
  const MockSpeechRecognition = vi.fn(function() {
      this.start = function() { if (this.onstart) this.onstart(); };
      this.stop = function() { if (this.onend) this.onend(); };
      this.abort = vi.fn();
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
      this.onresult = null;
  });
  (window as any).SpeechRecognition = MockSpeechRecognition;
  (window as any).webkitSpeechRecognition = MockSpeechRecognition;
};

const TestComponent = ({ onRender, options }: { onRender: () => void, options?: any }) => {
  const hookResult = useSpeechRecognition(options);
  const { start, stop, volume } = hookResult;

  // Use a ref to expose controls without re-triggering render effects in parent test
  const controlsRef = useRef({ start, stop });
  controlsRef.current = { start, stop };

  useEffect(() => {
    (window as any).testControls = controlsRef.current;
  });

  onRender();
  return <div>Volume: {volume}</div>;
};

describe('useSpeechRecognition Benchmark', () => {
  beforeEach(() => {
    setupMocks();
    vi.useFakeTimers();
    let val = 10;
    mockGetByteFrequencyData.mockImplementation((array: Uint8Array) => {
        // Vary data to ensure volume changes and triggers re-renders
        // Use small values to avoid hitting the 100 cap (val * 2.5)
        val = val === 10 ? 20 : 10;
        array.fill(val);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('measures render frequency with default settings', async () => {
    let renderCount = 0;
    const onRender = () => { renderCount++; };

    render(<TestComponent onRender={onRender} />);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    // Start listening
    await act(async () => {
      (window as any).testControls.start();
    });

    // Flush microtasks to allow startVolumeAnalysis to complete
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    });

    // Advance time by 1000ms
    // With 60fps rAF, we expect approx 60 renders
    // Note: rAF in fake timers usually runs on every advance or specifically flush

    // We simulate 60 frames
    const frames = 60;
    const msPerFrame = 16.6;

    for (let i = 0; i < frames; i++) {
        await act(async () => {
             vi.advanceTimersByTime(msPerFrame);
        });
    }

    console.log(`[Baseline] Renders in 1 second: ${renderCount}`);
    console.log(`[Baseline] rAF calls: ${rafSpy.mock.calls.length}`);

    // Cleanup
    await act(async () => {
        (window as any).testControls.stop();
    });
  });

  it('measures render frequency with volume meter disabled', async () => {
    let renderCount = 0;
    const onRender = () => { renderCount++; };

    // This test assumes implementation of enableVolumeMeter option (step 3)
    // For now, it tests the baseline (which ignores the option), so it should match baseline
    // Once implemented, this should drop significantly.
    render(<TestComponent onRender={onRender} options={{ enableVolumeMeter: false }} />);

    await act(async () => {
      (window as any).testControls.start();
    });

    const frames = 60;
    const msPerFrame = 16.6;

    for (let i = 0; i < frames; i++) {
        await act(async () => {
             vi.advanceTimersByTime(msPerFrame);
        });
    }

    console.log(`[Disabled] Renders in 1 second: ${renderCount}`);

    await act(async () => {
        (window as any).testControls.stop();
    });
  });
});

import React from 'react';
import { render, act } from '@testing-library/react';
import TeleprompterModal from './TeleprompterModal';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as SpeechHook from './useSpeechRecognition';

// Mock dependencies to avoid complex setup
vi.mock('./geminiService', () => ({
  generatePart2: vi.fn(),
  TLPError: class extends Error {}
}));

// Mock child components that might have their own side effects
vi.mock('./CardCaptureWidget', () => ({
  default: () => <div data-testid="card-capture-widget">Widget</div>
}));

describe('TeleprompterModal Performance Baseline', () => {
  let setVolumeCallback: (vol: number) => void;

  beforeEach(() => {
    // Reset mocks
    vi.restoreAllMocks();

    // Mock DOM methods
    window.HTMLElement.prototype.scrollTo = vi.fn();

    // Mock useSpeechRecognition
    vi.spyOn(SpeechHook, 'useSpeechRecognition').mockImplementation((options: any) => {
      const { disableVolumeState } = options || {};
      const [volume, setVolumeState] = React.useState(0);
      const subscribersRef = React.useRef<Set<(v: number) => void>>(new Set());

      // Mock the internal update logic
      setVolumeCallback = (newVol: number) => {
        // Call subscribers
        subscribersRef.current.forEach(cb => cb(newVol));

        // Update state ONLY if not disabled
        if (!disableVolumeState) {
          setVolumeState(newVol);
        }
      };

      const subscribeToVolume = (cb: (v: number) => void) => {
        subscribersRef.current.add(cb);
        return () => subscribersRef.current.delete(cb);
      };

      return {
        isListening: true,
        transcript: '',
        interimTranscript: '',
        volume: volume, // Use the state volume
        start: vi.fn(),
        stop: vi.fn(),
        reset: vi.fn(),
        error: null,
        subscribeToVolume
      };
    });
  });

  it('renders significantly fewer times with optimization', () => {
    const useSpeechSpy = vi.spyOn(SpeechHook, 'useSpeechRecognition');

    render(
        <TeleprompterModal
          script="Test script"
          onClose={vi.fn()}
          isPhase1={true}
        />
    );

    // Reset spy count from initial render
    const initialCalls = useSpeechSpy.mock.calls.length;

    // Simulate volume updates
    act(() => {
      setVolumeCallback(10);
    });

    act(() => {
      setVolumeCallback(20);
    });

    act(() => {
      setVolumeCallback(30);
    });

    const finalCalls = useSpeechSpy.mock.calls.length;

    // The component should NOT have re-rendered, so the hook should NOT have been called again
    expect(finalCalls).toBe(initialCalls);
  });
});

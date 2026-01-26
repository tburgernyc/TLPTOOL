import React from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
import TeleprompterModal from './TeleprompterModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as SpeechHook from './useSpeechRecognition';

// Mock dependencies to avoid complex setup
vi.mock('./geminiService', () => ({
  generatePart2: vi.fn(),
  TLPError: class extends Error {}
}));

// Spy on CardCaptureWidget
const CardCaptureWidgetSpy = vi.fn();
// We use React.memo in the mock to verify that PROPS are stable.
// If props change, React.memo would re-render.
const MockWidget = React.memo((props: any) => {
  CardCaptureWidgetSpy(props);
  return <div data-testid="card-capture-widget">Widget</div>;
});

// Mock child components
vi.mock('./CardCaptureWidget', () => ({
  default: (props: any) => <MockWidget {...props} />
}));

describe('TeleprompterModal Performance', () => {
  let setVolumeCallback: (vol: number) => void;
  let startMock: any;
  let stopMock: any;
  let resetMock: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    CardCaptureWidgetSpy.mockClear();

    // Mock DOM methods
    window.HTMLElement.prototype.scrollTo = vi.fn();
    window.HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {}
    }));

    startMock = vi.fn();
    stopMock = vi.fn();
    resetMock = vi.fn();

    // Mock useSpeechRecognition
    vi.spyOn(SpeechHook, 'useSpeechRecognition').mockImplementation((options: any) => {
      const { disableVolumeState } = options || {};
      const [volume, setVolumeState] = React.useState(0);
      const subscribersRef = React.useRef<Set<(v: number) => void>>(new Set());

      // Mock the internal update logic
      setVolumeCallback = (newVol: number) => {
        subscribersRef.current.forEach(cb => cb(newVol));
        if (!disableVolumeState) {
          setVolumeState(newVol);
        }
      };

      const subscribeToVolume = React.useCallback((cb: (v: number) => void) => {
        subscribersRef.current.add(cb);
        return () => subscribersRef.current.delete(cb);
      }, []);

      return {
        isListening: true,
        transcript: '',
        interimTranscript: '',
        volume: volume,
        start: startMock, // Stable ref
        stop: stopMock,   // Stable ref
        reset: resetMock, // Stable ref
        error: null,
        subscribeToVolume
      };
    });
  });

  it('Modal does not re-render on volume updates when disabled', () => {
    const useSpeechSpy = vi.spyOn(SpeechHook, 'useSpeechRecognition');

    render(
        <TeleprompterModal
          script="Test script"
          onClose={vi.fn()}
          isPhase1={true}
        />
    );

    const initialCalls = useSpeechSpy.mock.calls.length;

    act(() => { setVolumeCallback(10); });
    act(() => { setVolumeCallback(20); });

    const finalCalls = useSpeechSpy.mock.calls.length;
    expect(finalCalls).toBe(initialCalls);
  });

  it('CardCaptureWidget does not re-render when Modal re-renders for unrelated reasons', () => {
    render(
      <TeleprompterModal
        script="Test script"
        onClose={vi.fn()}
        isPhase1={true}
        initialParams={{ sign: 'Aries', mode: 'general' }}
        astrologyData={{ sunSign: 'Aries' } as any}
      />
    );

    // Initial render
    expect(CardCaptureWidgetSpy).toHaveBeenCalledTimes(1);

    // Trigger state update in Modal (Toggle Pause)
    const pauseButton = screen.getByTitle('Toggle Sequence [SPACE]');
    fireEvent.click(pauseButton);

    // Should NOT re-render CardCaptureWidget
    expect(CardCaptureWidgetSpy).toHaveBeenCalledTimes(1);
  });
});

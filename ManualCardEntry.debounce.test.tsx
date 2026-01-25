
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManualCardEntry from './ManualCardEntry';
import * as cardMatcherModule from './cardMatcher';
import { Spread } from './types';

// Mock values controlled by test
let mockHookState = {
  isListening: false,
  transcript: '',
  interimTranscript: '',
  start: vi.fn(),
  stop: vi.fn(),
};

vi.mock('./useSpeechRecognition', () => ({
  useSpeechRecognition: () => mockHookState,
}));

describe('ManualCardEntry Debounce Verification', () => {
  const mockSpread: Spread = {
    situation: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    feelings: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    message: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    outcome: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    bottom: { name: '', orientation: 'Upright', imageUrl: '' },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockHookState = {
      isListening: false,
      transcript: '',
      interimTranscript: '',
      start: vi.fn(),
      stop: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces calls to parseCardFromSpeech', async () => {
    const parseSpy = vi.spyOn(cardMatcherModule, 'parseCardFromSpeech');

    const { rerender } = render(<ManualCardEntry spread={mockSpread} onChange={() => {}} />);

    // Find mic button
    const buttons = screen.getAllByRole('button');
    let micBtn = null;
    for (const btn of buttons) {
        fireEvent.click(btn);
        if (mockHookState.start.mock.calls.length > 0) {
            micBtn = btn;
            break;
        }
    }
    if (!micBtn) throw new Error("Could not find mic button");
    mockHookState.start.mockClear();

    // 1. Update text "A"
    mockHookState = { ...mockHookState, isListening: true, interimTranscript: 'A' };
    rerender(<ManualCardEntry spread={mockSpread} onChange={() => {}} />);

    // Should NOT call immediately
    expect(parseSpy).toHaveBeenCalledTimes(0);

    // 2. Update text "Ac" (within debounce window)
    act(() => {
        vi.advanceTimersByTime(100);
    });
    mockHookState = { ...mockHookState, isListening: true, interimTranscript: 'Ac' };
    rerender(<ManualCardEntry spread={mockSpread} onChange={() => {}} />);

    // Still no call
    expect(parseSpy).toHaveBeenCalledTimes(0);

    // 3. Update text "Ace" (within debounce window)
    act(() => {
        vi.advanceTimersByTime(100);
    });
    mockHookState = { ...mockHookState, isListening: true, interimTranscript: 'Ace' };
    rerender(<ManualCardEntry spread={mockSpread} onChange={() => {}} />);

    // Still no call
    expect(parseSpy).toHaveBeenCalledTimes(0);

    // 4. Wait for debounce to settle (300ms total, we waited 200 so far, need 300 more from last update)
    act(() => {
        vi.advanceTimersByTime(350);
    });

    // Should have called ONCE with "Ace"
    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(parseSpy).toHaveBeenCalledWith('Ace', expect.anything());
  });
});

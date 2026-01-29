import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManualCardEntry from './ManualCardEntry';
import * as cardMatcherModule from './cardMatcher';
import { Spread } from './types';

// Mock useSpeechRecognition
vi.mock('./useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

describe('ManualCardEntry Input Validation Debounce', () => {
  const initialSpread: Spread = {
    situation: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    feelings: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    message: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    outcome: [{ name: '', orientation: 'Upright', imageUrl: '' }],
    bottom: { name: '', orientation: 'Upright', imageUrl: '' },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces calls to findCardMatch when typing in input', () => {
    const findMatchSpy = vi.spyOn(cardMatcherModule, 'findCardMatch');

    // We need to manage state to simulate parent component behavior
    let currentSpread = initialSpread;

    const handleChange = (newSpread: Spread) => {
        currentSpread = newSpread;
        rerender(<ManualCardEntry spread={currentSpread} onChange={handleChange} />);
    };

    const { rerender } = render(<ManualCardEntry spread={currentSpread} onChange={handleChange} />);

    // Find the first input
    const inputs = screen.getAllByPlaceholderText('TYPE CARD NAME...');
    const input = inputs[0];

    // 1. Type "T"
    fireEvent.change(input, { target: { value: 'T' } });

    // Check spread updated?
    expect(currentSpread.situation[0].name).toBe('T');

    // findCardMatch should NOT be called immediately (due to debounce)
    expect(findMatchSpy).toHaveBeenCalledTimes(0);

    // 2. Advance time a bit (100ms) - still not called
    act(() => {
        vi.advanceTimersByTime(100);
    });
    expect(findMatchSpy).toHaveBeenCalledTimes(0);

    // 3. Type "Th"
    fireEvent.change(input, { target: { value: 'Th' } });
    expect(currentSpread.situation[0].name).toBe('Th');
    expect(findMatchSpy).toHaveBeenCalledTimes(0);

    // 4. Advance time past debounce (300ms)
    act(() => {
        vi.advanceTimersByTime(350);
    });

    // Should be called ONCE with "Th"
    expect(findMatchSpy).toHaveBeenCalledTimes(1);
    expect(findMatchSpy).toHaveBeenCalledWith('Th', expect.anything());

    findMatchSpy.mockClear();

    // 5. Type "The"
    fireEvent.change(input, { target: { value: 'The' } });
    act(() => {
        vi.advanceTimersByTime(350);
    });
    expect(findMatchSpy).toHaveBeenCalledTimes(1);
    expect(findMatchSpy).toHaveBeenCalledWith('The', expect.anything());
  });
});

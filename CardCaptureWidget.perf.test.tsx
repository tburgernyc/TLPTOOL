import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CardCaptureWidget from './CardCaptureWidget';
import * as cardMatcher from './cardMatcher';

// Mock dependencies
vi.mock('./tarotCardDatabase', () => ({
  flatCardDatabase: [],
  flattenCardDatabase: () => [],
}));

vi.mock('./cardMatcher', () => ({
  parseCardFromSpeech: vi.fn(() => ({ success: false, card: null, confidence: 0, tier: 'None' })),
}));

describe('CardCaptureWidget Performance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces calls to parseCardFromSpeech', () => {
    const { rerender } = render(
      <CardCaptureWidget
        onCardCaptured={() => {}}
        capturedCards={[]}
        onReset={() => {}}
        isListening={true}
        transcript=""
        interimTranscript="Initial"
        volume={0}
        start={() => {}}
        stop={() => {}}
        reset={() => {}}
        pendingCard={null}
        setPendingCard={() => {}}
      />
    );

    // Initial render should start a timer but not call yet
    expect(cardMatcher.parseCardFromSpeech).not.toHaveBeenCalled();

    // Simulate rapid updates
    const updates = ['Update1', 'Update2', 'Update3', 'Update4'];
    updates.forEach(text => {
      rerender(
        <CardCaptureWidget
          onCardCaptured={() => {}}
          capturedCards={[]}
          onReset={() => {}}
          isListening={true}
          transcript=""
          interimTranscript={text}
          volume={0}
          start={() => {}}
          stop={() => {}}
          reset={() => {}}
          pendingCard={null}
          setPendingCard={() => {}}
        />
      );
    });

    // Still shouldn't have been called
    expect(cardMatcher.parseCardFromSpeech).not.toHaveBeenCalled();

    // Advance time to trigger the debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should be called exactly once (for the last update "Update4")
    expect(cardMatcher.parseCardFromSpeech).toHaveBeenCalledTimes(1);
    expect(cardMatcher.parseCardFromSpeech).toHaveBeenCalledWith('Update4', expect.any(Array));
  });
});

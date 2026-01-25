import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManualCardEntry from './ManualCardEntry';
import * as dbModule from './tarotCardDatabase';
import { Spread } from './types';

// Mock useSpeechRecognition
vi.mock('./useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    volume: 0,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    error: null,
  }),
}));

describe('ManualCardEntry Performance', () => {
  const mockSpread: Spread = {
    situation: [{ name: 'The Fool', orientation: 'Upright', imageUrl: '' }],
    feelings: [{ name: 'The Magician', orientation: 'Upright', imageUrl: '' }],
    message: [{ name: 'The Empress', orientation: 'Upright', imageUrl: '' }],
    outcome: [{ name: 'The Emperor', orientation: 'Upright', imageUrl: '' }],
    bottom: { name: 'The World', orientation: 'Upright', imageUrl: '' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls flattenCardDatabase once (Optimized behavior)', () => {
    // We spy on the real implementation
    const spy = vi.spyOn(dbModule, 'flattenCardDatabase');

    render(<ManualCardEntry spread={mockSpread} onChange={() => {}} />);

    // ManualCardEntry uses the exported singleton, so it shouldn't call flattenCardDatabase again.
    expect(spy.mock.calls.length).toBe(0);
    console.log(`flattenCardDatabase called ${spy.mock.calls.length} times during render.`);
  });

  it('measures execution time of flattenCardDatabase', () => {
     const ITERATIONS = 1000;
     const start = performance.now();
     for(let i=0; i<ITERATIONS; i++) {
         dbModule.flattenCardDatabase();
     }
     const end = performance.now();
     console.log(`1000 calls to flattenCardDatabase took ${(end - start).toFixed(2)}ms`);
     expect(end - start).toBeGreaterThan(0);
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ManualCardEntry from './ManualCardEntry';
import { Spread, TarotCard } from './types';

// Mock useSpeechRecognition
vi.mock('./useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn()
  })
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockCard: TarotCard = { name: '', orientation: 'Upright', imageUrl: '' };
const mockSpread: Spread = {
  situation: [mockCard, mockCard, mockCard],
  feelings: [mockCard, mockCard, mockCard],
  message: [mockCard, mockCard, mockCard],
  outcome: [mockCard, mockCard, mockCard],
  bottom: mockCard
};

describe('ManualCardEntry', () => {
  it('replaces digits with words in card input', () => {
    const handleChange = vi.fn();
    render(<ManualCardEntry spread={mockSpread} onChange={handleChange} />);

    // Find the first input
    const inputs = screen.getAllByPlaceholderText('TYPE CARD NAME...');
    const firstInput = inputs[0];

    // Simulate typing "10 of Cups"
    fireEvent.change(firstInput, { target: { value: '10 of Cups' } });

    // Expect onChange to be called with "Ten of Cups"
    // Since ManualCardEntry clones the spread and updates the specific card,
    // we check the arguments passed to onChange.
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const newSpread = lastCall[0] as Spread;
    expect(newSpread.situation[0].name).toBe('Ten of Cups');
  });

  it('replaces "1" with "Ace"', () => {
    const handleChange = vi.fn();
    render(<ManualCardEntry spread={mockSpread} onChange={handleChange} />);

    const inputs = screen.getAllByPlaceholderText('TYPE CARD NAME...');
    const firstInput = inputs[0];

    fireEvent.change(firstInput, { target: { value: '1 of Wands' } });

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const newSpread = lastCall[0] as Spread;
    expect(newSpread.situation[0].name).toBe('Ace of Wands');
  });

  it('does not replace "10" inside other words if boundary prevents it', () => {
    const handleChange = vi.fn();
    render(<ManualCardEntry spread={mockSpread} onChange={handleChange} />);

    const inputs = screen.getAllByPlaceholderText('TYPE CARD NAME...');
    const firstInput = inputs[0];

    fireEvent.change(firstInput, { target: { value: '10th' } });

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const newSpread = lastCall[0] as Spread;
    // Should NOT match "10" in "10th"
    expect(newSpread.situation[0].name).toBe('10th');
  });

  it('handles mixed content', () => {
    const handleChange = vi.fn();
    render(<ManualCardEntry spread={mockSpread} onChange={handleChange} />);

    const inputs = screen.getAllByPlaceholderText('TYPE CARD NAME...');
    const firstInput = inputs[0];

    fireEvent.change(firstInput, { target: { value: '3 Swords 10 Cups' } });

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const newSpread = lastCall[0] as Spread;
    expect(newSpread.situation[0].name).toBe('Three Swords Ten Cups');
  });
});

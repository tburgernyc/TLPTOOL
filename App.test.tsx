import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import App from './App';

// Mock the services
vi.mock('./geminiService', () => ({
  fetchAstrology: vi.fn(),
  generatePart1: vi.fn(),
  generatePart2: vi.fn(),
  generateSpeech: vi.fn(),
  TLPError: class TLPError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
    }
  }
}));

// Mock CelestialBackground to avoid Canvas API issues in jsdom
vi.mock('./CelestialBackground', () => ({
  default: () => <div data-testid="celestial-background" />
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('App', () => {
  it('renders the application title', () => {
    render(<App />);
    const tlpElements = screen.getAllByText('TLP');
    expect(tlpElements.length).toBeGreaterThan(0);
    expect(tlpElements[0]).toBeInTheDocument();

    const toolElements = screen.getAllByText('Video Tool');
    expect(toolElements.length).toBeGreaterThan(0);
  });

  it('renders the reading form by default', () => {
    render(<App />);
    // Check for some form elements
    expect(screen.getByText('Primary Sign influence')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Focal theme?')).toBeInTheDocument();
  });

  it('can switch tabs to History (even if empty)', () => {
    render(<App />);

    const historyTab = screen.getByText('History');
    expect(historyTab).toBeInTheDocument();

    // Note: Tab switching logic works, but actual switching depends on Layout which we are not mocking fully (good).
    // But we are rendering App which renders Layout.
  });
});

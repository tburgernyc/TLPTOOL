import React, { Profiler } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CelestialBackground from './CelestialBackground';

describe('CelestialBackground Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders only once on mousemove (optimized)', async () => {
    // Stub requestAnimationFrame to execute immediately
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
      fn(0);
      return 0;
    });

    const onRender = vi.fn();

    const { container } = render(
      <Profiler id="CelestialBackground" onRender={onRender}>
        <CelestialBackground />
      </Profiler>
    );

    // Initial render
    expect(onRender).toHaveBeenCalledTimes(1);

    // Get a reference to one of the moving elements (e.g., background)
    // The background has `scale-105` class
    const bgElement = container.querySelector('.scale-105') as HTMLElement;
    expect(bgElement).toBeTruthy();
    // Initial style
    expect(bgElement.style.transform).toBe('translate(0px, 0px) scale(1.15)');

    // Simulate mouse moves
    const moveCount = 20;

    await act(async () => {
        // Move mouse to bottom right corner
        // window innerWidth/Height are defaults (1024x768 usually in JSDOM)
        fireEvent.mouseMove(window, {
          clientX: window.innerWidth,
          clientY: window.innerHeight,
        });
    });

    // Renders should still be 1 because we are bypassing React state
    expect(onRender).toHaveBeenCalledTimes(1);

    // Verify style update
    // x should be: (window.innerWidth / window.innerWidth) * 2 - 1 = 1
    // y should be: 1
    // transform: translate(${1 * -15}px, ${1 * -15}px) scale(1.15)
    // = translate(-15px, -15px) scale(1.15)

    expect(bgElement.style.transform).toBe('translate(-15px, -15px) scale(1.15)');
  });
});

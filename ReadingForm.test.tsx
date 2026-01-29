import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ReadingForm from './ReadingForm';
import { ReadingMode, ReadingLength } from './types';
import { ZODIAC_SIGNS } from './constants';

describe('ReadingForm', () => {
  it('renders correctly with default values', () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} isLoading={false} />);

    expect(screen.getByText('Primary Sign influence')).toBeInTheDocument();
    expect(screen.getByText('Operational logic')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Focal theme?')).toBeInTheDocument();
    expect(screen.getByText('Synthesize script')).toBeInTheDocument();
  });

  it('updates input fields', () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} isLoading={false} />);

    const topicInput = screen.getByPlaceholderText('Focal theme?');
    fireEvent.change(topicInput, { target: { value: 'New Topic' } });
    expect(topicInput).toHaveValue('New Topic');
  });

  it('submits the form with correct data', () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} isLoading={false} />);

    // Fill in required topic
    const topicInput = screen.getByPlaceholderText('Focal theme?');
    fireEvent.change(topicInput, { target: { value: 'My Reading' } });

    // Submit
    const submitButton = screen.getByText('Synthesize script').closest('button');
    fireEvent.click(submitButton!);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const formData = handleSubmit.mock.calls[0][0];
    expect(formData.topic).toBe('My Reading');
    expect(formData.sign).toBe(ZODIAC_SIGNS[0]); // Default
    expect(formData.mode).toBe(ReadingMode.COLLECTIVE); // Default
  });

  it('shows loading state', () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} isLoading={true} />);

    expect(screen.getByText('Transmitting...')).toBeInTheDocument();
    const button = screen.getByText('Transmitting...').closest('button');
    expect(button).toBeDisabled();
  });

  it('shows specific fields when Specific mode is selected', () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} isLoading={false} />);

    // Initially not visible (assuming default is COLLECTIVE)
    expect(screen.queryByText('Target Name')).not.toBeInTheDocument();

    // Change mode to Specific
    // Note: The CustomSelect component uses buttons.
    // We need to open the dropdown first.
    // Finding the button for "Operational logic" might be tricky as there are multiple CustomSelects.
    // We can try to find the button that contains "Collective"

    const modeSelectButton = screen.getByText('Collective').closest('button');
    fireEvent.click(modeSelectButton!);

    // Now click "Specific Querent"
    const specificOption = screen.getByText('Specific Querent');
    fireEvent.click(specificOption);

    // Now Specific fields should be visible
    expect(screen.getByText('Target Name')).toBeInTheDocument();
    expect(screen.getByText('Birth Date')).toBeInTheDocument();
  });
});

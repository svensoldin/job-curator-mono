import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Input } from '.';

describe('Input', () => {
  it('renders an input element with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with a label when provided', () => {
    render(<Input label='Username' />);
    const label = screen.getByLabelText('Username');
    expect(label).toBeInTheDocument();
  });

  it('renders helper text when provided', () => {
    render(<Input helperText='This is a helpful message' />);
    expect(screen.getByText('This is a helpful message')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Input error='This field is required' />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });

  it('does not render helper text when error is present', () => {
    render(<Input helperText='This is helpful' error='This is an error' />);
    expect(screen.queryByText('This is helpful')).not.toBeInTheDocument();
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  it('handles user input correctly', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('passes through HTML input attributes', () => {
    render(
      <Input placeholder='Enter text here' type='email' required disabled />
    );
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('placeholder', 'Enter text here');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });

  it('maintains consistent id between label and input', () => {
    render(<Input label='Test Label' id='test-id' />);
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Label');

    expect(input).toHaveAttribute('id', 'test-id');
    expect(label).toHaveAttribute('for', 'test-id');
  });

  it('generates a random id if none provided', () => {
    render(<Input label='Test Label' />);
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Label');

    expect(input.id).toBeTruthy();
    expect(label).toHaveAttribute('for', input.id);
  });
});

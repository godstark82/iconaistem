/**
 * Hero component tests
 * Framework: React Testing Library with Jest/Vitest globals
 * Notes:
 * - Uses @testing-library/react and @testing-library/jest-dom matchers.
 * - Does not rely on jest/vi-specific spies; window.location is stubbed directly.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from './Hero';

describe('Hero component', () => {
  const ORIGINAL_LOCATION = window.location;

  beforeEach(() => {
    // Stub window.location with a writable href for navigation assertions
    delete window.location;
    // Minimal stub; only href is needed for these tests
    window.location = { href: 'http://localhost/' };
  });

  afterEach(() => {
    // Restore original location after each test to avoid cross-test pollution
    window.location = ORIGINAL_LOCATION;
  });

  test('renders the conference title and year', () => {
    render(<Hero />);
    expect(screen.getByText(/IC-TAAA/i)).toBeInTheDocument();
    // Year appears as nested span
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  test('renders the full conference tagline', () => {
    render(<Hero />);
    // Match a distinctive substring to avoid brittleness over punctuation
    expect(
      screen.getByText(/Technological Advances in AI/i)
    ).toBeInTheDocument();
  });

  test('renders the special session information', () => {
    render(<Hero />);
    expect(
      screen.getByText(/\(Special session on Bio Sciences\)/i)
    ).toBeInTheDocument();
  });

  test('renders the event date clearly', () => {
    render(<Hero />);
    expect(screen.getByText('September 6-7, 2025')).toBeInTheDocument();
  });

  test('renders the Scopus logo with correct alt text and source', () => {
    render(<Hero />);
    const logo = screen.getByAltText('Scopus Logo');
    expect(logo).toBeInTheDocument();
    // Use getAttribute to assert the literal attribute value
    expect(logo.getAttribute('src')).toBe('images/scopus-logo-hero.png');
  });

  test('navigates to the upload page when "Submit Paper" is clicked', () => {
    render(<Hero />);
    const button = screen.getByRole('button', { name: /submit paper/i });
    fireEvent.click(button);
    expect(window.location.href).toBe('/upload-paper');
  });

  test('button is focusable and accessible by role/name', () => {
    render(<Hero />);
    const btn = screen.getByRole('button', { name: /submit paper/i });
    expect(btn).toBeInTheDocument();
    btn.focus();
    expect(btn).toHaveFocus();
  });
});
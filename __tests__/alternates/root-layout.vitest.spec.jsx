/**
 * Alternate version for Vitest users.
 * Replace your config and test runner accordingly.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('next/font/google', () => {
  return {
    Inter: () => ({ className: 'mocked-inter-font' }),
  };
});

vi.mock('../tests/globals.css', () => ({}), { virtual: true });

vi.mock('../components/layout/Layout', () => {
  return {
    default: function LayoutMock({ children }) {
      return <div data-testid="layout-mock">{children}</div>;
    },
  };
});

import RootLayout, { metadata } from '../tests/test-utils.jsx';

describe('RootLayout (Vitest)', () => {
  it('renders html/body and wraps children', () => {
    render(
      <RootLayout>
        <div>child</div>
      </RootLayout>
    );
    expect(document.querySelector('html')).toHaveAttribute('lang', 'en');
    expect(document.querySelector('body')?.className).toContain('mocked-inter-font');
    expect(screen.getByTestId('layout-mock')).toBeInTheDocument();
  });
});

describe('metadata export (Vitest)', () => {
  it('has expected fields', () => {
    expect(metadata.title).toBe('ICTAAA 2026');
    expect(metadata.description).toBe(
      'Sustainable Innovations in Management in the Digital Transformation Era'
    );
  });
});
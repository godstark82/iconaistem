/**
 * Tests for RootLayout and exported metadata from tests/test-utils.jsx
 * Assumes Jest + React Testing Library with jsdom.
 * If your project uses Vitest, replace jest.mock with vi.mock and test imports accordingly.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/font/google to avoid loading fonts in test env
jest.mock('next/font/google', () => {
  return {
    Inter: () => ({ className: 'mocked-inter-font' }),
  };
});

// Mock the global CSS import used by the component under test
jest.mock('../tests/globals.css', () => ({}), { virtual: true });

// Mock Layout to a transparent wrapper we can assert against
jest.mock('../components/layout/Layout', () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout-mock">{children}</div>;
  };
});

import RootLayout, { metadata } from '../tests/test-utils.jsx';

describe('RootLayout', () => {
  it('renders html with lang="en" and body with Inter className', () => {
    render(
      <RootLayout>
        <div>child-content</div>
      </RootLayout>
    );
    const html = document.querySelector('html');
    const body = document.querySelector('body');

    expect(html).toBeInTheDocument();
    expect(html).toHaveAttribute('lang', 'en');

    expect(body).toBeInTheDocument();
    // Inter mock should supply this class on body
    expect(body.className).toContain('mocked-inter-font');
  });

  it('wraps children with Layout component', () => {
    render(
      <RootLayout>
        <span data-testid="inner-child">hello</span>
      </RootLayout>
    );
    const layout = screen.getByTestId('layout-mock');
    expect(layout).toBeInTheDocument();
    expect(screen.getByTestId('inner-child')).toBeInTheDocument();
  });

  it('handles empty children gracefully', () => {
    // Should still render html/body and Layout, even with no children
    render(<RootLayout />);
    const layout = screen.getByTestId('layout-mock');
    expect(layout).toBeInTheDocument();
    // No child node specific assertion necessary; presence of layout suffices
  });
});

describe('metadata export', () => {
  it('exposes expected title and description', () => {
    // From provided source: title: 'ICTAAA 2026'
    // description: 'Sustainable Innovations in Management in the Digital Transformation Era'
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('ICTAAA 2026');
    expect(metadata.description).toBe(
      'Sustainable Innovations in Management in the Digital Transformation Era'
    );
  });

  it('does not include unexpected keys', () => {
    // Sanity check for typical metadata shape in this file
    const keys = Object.keys(metadata).sort();
    expect(keys).toEqual(['description', 'title']);
  });
});
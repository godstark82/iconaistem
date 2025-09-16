/* Testing library/framework: Jest/Vitest (auto-detected) + @testing-library/react (assumed) */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Ensure Next.js <Link> renders as an anchor for tests (works in Jest or Vitest)
const mocker = globalThis.vi ?? globalThis.jest;
if (mocker && typeof mocker.mock === 'function') {
  mocker.mock('next/link', () => {
    const React = require('react');
    return {
      __esModule: true,
      default: ({ href, children, ...rest }) =>
        React.createElement('a', { href: typeof href === 'string' ? href : href?.pathname, ...rest }, children),
    };
  });
}

import Footer from '../../src/components/Footer.jsx';

describe('Footer', () => {
  beforeAll(() => {
    const m = globalThis.vi ?? globalThis.jest;
    const useFakeTimers = m?.useFakeTimers ?? (() => {});
    const setSystemTime = m?.setSystemTime ?? (() => {});
    useFakeTimers();
    setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterAll(() => {
    const m = globalThis.vi ?? globalThis.jest;
    const useRealTimers = m?.useRealTimers ?? (() => {});
    useRealTimers();
  });

  it('renders the key section headings', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /Address/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Quick Links/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Conference Venue/i })).toBeInTheDocument();
  });

  it('renders the address text and contact links', () => {
    render(<Footer />);
    // Address content snippet
    expect(screen.getByText(/Arya College of Engineering/i)).toBeInTheDocument();

    // Phone link
    const phone = screen.getByRole('link', { name: /\+91 8209346745/ });
    expect(phone).toHaveAttribute('href', 'https://wa.me/8209346745');

    // Email link (source contains spaces around mailto and address)
    const email = screen.getByRole('link', { name: /submit@ICTAAA\.com/i });
    expect(email.getAttribute('href') || '').toMatch(/mailto:\s*submit@ICTAAA\.com/i);
  });

  it('renders About links with correct destinations', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Arya College, Jaipur' })).toHaveAttribute('href', '/about/utb');
    expect(screen.getByRole('link', { name: 'Important Dates' })).toHaveAttribute('href', '/about/important-dates');
    expect(screen.getByRole('link', { name: 'Programme' })).toHaveAttribute('href', '/about/programme');
    expect(screen.getByRole('link', { name: 'Accommodation Options' })).toHaveAttribute('href', '/about/accommodation-options');
  });

  it('renders Quick Links with correct destinations', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Upload Paper' })).toHaveAttribute('href', '/upload-paper');
    expect(screen.getByRole('link', { name: 'Registration' })).toHaveAttribute('href', '/registration');
    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveAttribute('href', '/downloads');
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact-us');
    expect(screen.getByRole('link', { name: 'Administrator' })).toHaveAttribute('href', '/admin');
  });

  it('includes social media links with target and rel', () => {
    const { container } = render(<Footer />);
    const check = (href) => {
      const el = container.querySelector(`a[href="${href}"]`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute('target', '_blank');
      expect(el).toHaveAttribute('rel', 'noopener noreferrer');
    };
    check('https://www.facebook.com/aryacollegein/');
    check('https://x.com/aryacolleges');
    check('https://in.linkedin.com/school/aryacollege/');
    check('https://www.instagram.com/aryacollege/');
    check('https://www.youtube.com/user/AryaColleges');
  });

  it('renders a Google Maps iframe with required attributes', () => {
    const { container } = render(<Footer />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute('src') || '').toMatch(/google\.com\/maps\/embed/);
    expect(iframe).toHaveAttribute('width', '100%');
    expect(iframe).toHaveAttribute('height', '200');
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  });

  it('shows the current year in the copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/ICTAAA © 2024 All rights reserved\./)).toBeInTheDocument();
  });
});
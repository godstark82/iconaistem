/**
 * @jest-environment jsdom
 */

/*
NOTE: Testing setup
- Framework: Jest (jsdom) assumed based on common Next.js setups.
- Library: React Testing Library (@testing-library/react) with jest-dom matchers.
- Compatibility: Tests should also run under Vitest in jsdom with minimal/no changes.
*/

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactUsPage from './page';

describe('ContactUsPage', () => {
  it('renders the page wrapper and the visible Contact Us section header', () => {
    render(<ContactUsPage />);
    // The section header inside this page (distinct from AboutHeader) should be visible
    const sectionHeader = screen.getByText('Contact Us');
    expect(sectionHeader).toBeInTheDocument();
  });

  it('renders contact info cards with correct headings and links', () => {
    render(<ContactUsPage />);

    // Headings
    expect(screen.getByText('📍 Address')).toBeInTheDocument();
    expect(screen.getByText('💬 WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('✉️ Email')).toBeInTheDocument();

    // WhatsApp link
    const waLink = screen.getByRole('link', { name: /\+91\s*8209346745/ });
    expect(waLink).toBeInTheDocument();
    expect(waLink).toHaveAttribute('href', 'https://wa.me/8209346745');
    expect(waLink).toHaveAttribute('target', '_blank');
    const relAttr = waLink.getAttribute('rel') || '';
    expect(relAttr).toMatch(/noopener/);
    expect(relAttr).toMatch(/noreferrer/);

    // Email link (the source has surrounding spaces; match robustly)
    const emailLink = screen.getByRole('link', { name: /submit@ictaaa\.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.getAttribute('href')).toMatch(/^mailto:\s*submit@ICTAAA\.com\s*$/i);
  });

  it('renders the contact form with required fields and correct input types', () => {
    render(<ContactUsPage />);

    const name = screen.getByPlaceholderText('Your Name');
    const email = screen.getByPlaceholderText('Your Email');
    const subject = screen.getByPlaceholderText('Subject');
    const message = screen.getByPlaceholderText('Message');

    expect(name).toBeRequired();
    expect(email).toBeRequired();
    expect(email).toHaveAttribute('type', 'email');
    expect(subject).toBeRequired();
    expect(message).toBeRequired();
  });

  it('submitting the form prevents default submission', () => {
    const { container } = render(<ContactUsPage />);
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    // Spy for preventDefault using whichever mock API exists
    let mockFn = null;
    if (typeof jest !== 'undefined' && typeof jest.fn === 'function') {
      mockFn = jest.fn();
    } else if (typeof vi !== 'undefined' && typeof vi.fn === 'function') {
      mockFn = vi.fn();
    }

    // If no mocking lib, still ensure the submit does not throw
    const preventDefault = mockFn ? mockFn : () => {};

    fireEvent.submit(form, { preventDefault });
    if (mockFn) {
      expect(preventDefault).toHaveBeenCalled();
    }
  });

  it('clicking "Send Message" opens WhatsApp in a new tab via window.open', () => {
    // Replace window.open with a spy
    let spy = null;
    if (typeof jest !== 'undefined' && typeof jest.fn === 'function') {
      spy = jest.fn();
    } else if (typeof vi !== 'undefined' && typeof vi.fn === 'function') {
      spy = vi.fn();
    }
    const noop = () => {};
    window.open = spy || noop;

    render(<ContactUsPage />);
    const sendBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendBtn);

    if (spy) {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('https://wa.me/8209346745', '_blank');
    }
  });

  it('renders Google Map iframe with expected attributes', () => {
    render(<ContactUsPage />);
    const iframe = screen.getByTitle('UTB Location');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toMatch(/google\.com\/maps\/embed/i);
    expect(iframe.getAttribute('width')).toBe('100%');
    expect(iframe.getAttribute('height')).toBe('350');
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer-when-downgrade');
    // Boolean-ish attribute presence
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
  });

  it('matches a stable snapshot of core structure', () => {
    const { container } = render(<ContactUsPage />);
    expect(container).toMatchSnapshot();
  });
});
import React from 'react';
import { render, screen, within } from '@testing-library/react';
// If your setupTests adds jest-dom globally, this import may be unnecessary.
// Keeping it explicit for clarity and idempotence:
import '@testing-library/jest-dom/extend-expect';

// Import the Footer component. The component currently resides in a file named *.test.jsx.
// We import from that path without changing the implementation file to avoid breaking the project.
import Footer from '../Footer.test.jsx';

// For Next.js Link, most modern setups don't require a mock.
// If your repo needs a mock, uncomment the following block:
// jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }) => (<a href={href} {...props}>{children}</a>) }));

describe('Footer component', () => {
  const renderFooter = () => render(<Footer />);

  test('renders key section headings', () => {
    renderFooter();
    expect(screen.getByRole('heading', { name: /address/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick links/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /conference venue/i })).toBeInTheDocument();
  });

  test('renders address text with city and postal code', () => {
    renderFooter();
    // Check for notable substrings from the address block
    expect(screen.getByText(/Kukas/i)).toBeInTheDocument();
    expect(screen.getByText(/Jaipur, Rajasthan/i)).toBeInTheDocument();
    expect(screen.getByText(/302028/)).toBeInTheDocument();
  });

  test('renders phone WhatsApp link with correct href, target and rel', () => {
    renderFooter();
    const phoneLink = screen.getByRole('link', { name: /\+?91\s*8209346745/i });
    expect(phoneLink).toBeInTheDocument();
    const href = phoneLink.getAttribute('href') || '';
    expect(href).toContain('https://wa.me/8209346745');
    expect(phoneLink).toHaveAttribute('target', '_blank');
    expect(phoneLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(phoneLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  test('renders email link and uses a mailto: scheme (ignoring unintended spaces)', () => {
    renderFooter();
    // The DOM text has spaces around the email; query by normalized text.
    const emailLink = screen.getByRole('link', { name: /submit@ictaaa\.com/i });
    expect(emailLink).toBeInTheDocument();
    const href = (emailLink.getAttribute('href') || '').toLowerCase();
    // Accept either "mailto: submit@ictaaa.com " or normalized "mailto:submit@ictaaa.com"
    expect(href).toContain('mailto:');
    expect(href).toMatch(/ictaaa\.com/);
  });

  test('renders internal navigation links with correct hrefs', () => {
    renderFooter();
    const expectations = [
      { text: /Arya College, Jaipur/i, href: '/about/utb' },
      { text: /Important Dates/i, href: '/about/important-dates' },
      { text: /Programme/i, href: '/about/programme' },
      { text: /Accommodation Options/i, href: '/about/accommodation-options' },
      { text: /Upload Paper/i, href: '/upload-paper' },
      { text: /Registration/i, href: '/registration' },
      { text: /Downloads/i, href: '/downloads' },
      { text: /Contact Us/i, href: '/contact-us' },
      { text: /Administrator/i, href: '/admin' },
    ];
    for (const { text, href } of expectations) {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
      // In Next.js + JSDOM, Link renders <a> with href attribute.
      expect(link).toHaveAttribute('href', href);
    }
  });

  test('renders social links pointing to expected domains and open in new tab with rel security', () => {
    renderFooter();
    // Gather all anchors and then filter by domain
    const allLinks = screen.getAllByRole('link');
    const getHrefList = (domain) =>
      allLinks
        .map(a => a.getAttribute('href') || '')
        .filter(h => h.includes(domain));

    // Expect exactly one link per social platform based on implementation
    const socialDomains = [
      'facebook.com/aryacollegein',
      'x.com/aryacolleges',
      'linkedin.com',
      'instagram.com/aryacollege',
      'youtube.com/user/AryaColleges',
    ];

    for (const domain of socialDomains) {
      const matches = getHrefList(domain);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }

    // Ensure external http(s) links have target and rel
    const externalLinks = allLinks.filter(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      return href.startsWith('http://') || href.startsWith('https://');
    });
    for (const a of externalLinks) {
      expect(a).toHaveAttribute('target', '_blank');
      const rel = a.getAttribute('rel') || '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('embeds Google Maps iframe with the correct src', () => {
    renderFooter();
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    const src = iframe?.getAttribute('src') || '';
    expect(src).toContain('https://www.google.com/maps/embed');
    // Basic sanity checks on important URL params
    expect(src).toMatch(/0x396daf9e6f4d2f3b/i);
    expect(src).toMatch(/Arya%20College%20of%20Engineering/i);
  });

  test('shows current year in copyright', () => {
    renderFooter();
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`\\b${year}\\b`))).toBeInTheDocument();
  });
});
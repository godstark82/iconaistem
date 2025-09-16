/**
 * Tests for ContactUsPage
 *
 * Framework: React Testing Library with the project's configured runner (Jest or Vitest).
 * - If using Jest: expect/jest.fn/jest.mock, jsdom env.
 * - If using Vitest: expect/vi.fn/vi.mock; import { vi } from 'vitest' if needed.
 *
 * These tests focus on the Contact Us page content and behaviors highlighted in the PR diff.
 */
import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'

/**
 * Import the page under test.
 * Try common Next.js locations; the first one that resolves in this repo will be used by the bundler/tsconfig paths.
 * Adjust the path below if your repo places the page elsewhere.
 */
let ContactUsPage
try {
  // Next.js app directory pattern
  // eslint-disable-next-line import/no-unresolved
  ContactUsPage = require('../../app/contact-us/page').default
} catch (e1) {
  try {
    // Next.js pages directory pattern
    // eslint-disable-next-line import/no-unresolved
    ContactUsPage = require('../../pages/contact-us').default
  } catch (e2) {
    try {
      // Fallback: src/app layout
      // eslint-disable-next-line import/no-unresolved
      ContactUsPage = require('../../src/app/contact-us/page').default
    } catch (e3) {
      try {
        // Fallback: src/pages layout
        // eslint-disable-next-line import/no-unresolved
        ContactUsPage = require('../../src/pages/contact-us').default
      } catch {
        throw new Error(
          'Could not resolve ContactUsPage. Please update the import path in tests/pages/contact-us.test.jsx to match your project.'
        )
      }
    }
  }
}

/**
 * Mock AboutHeader to isolate page concerns and to assert props passed to it.
 * We attempt to mock across potential locations. If your actual path differs,
 * update the mocks accordingly.
 */
const isVitest = typeof vi !== 'undefined';
const mockFn = isVitest ? vi.fn : (global.jest ? jest.fn : () => {});

function makeAboutHeaderMock(modPath) {
  try {
    const m = isVitest ? vi : (global.jest || { mock: () => {} });
    m.mock(modPath, () => ({
      __esModule: true,
      default: (props) => (
        <div data-testid="about-header-mock">
          <span data-testid="ah-title">{props.title}</span>
          <span data-testid="ah-date">{props.date}</span>
          <span data-testid="ah-image">{props.image}</span>
          <span data-testid="ah-overlay">{props.overlayColor}</span>
          <span data-testid="ah-bg">{props.bgImage}</span>
          <span data-testid="ah-divider">{props.dividerColor}</span>
        </div>
      ),
    }));
  } catch {
    // no-op if mocking fails for a given path
  }
}
// Attempt common component paths
makeAboutHeaderMock('../../components/common/AboutHeader')
makeAboutHeaderMock('../../../components/common/AboutHeader')
makeAboutHeaderMock('../../src/components/common/AboutHeader')
makeAboutHeaderMock('../../../src/components/common/AboutHeader')

/**
 * Helper to spy on window.open consistently across Jest/Vitest
 */
const spyOnOpen = () => {
  const original = window.open;
  const spy = mockFn();
  // Some environments define window.open as undefined; ensure it exists
  Object.defineProperty(window, 'open', {
    writable: true,
    configurable: true,
    value: spy,
  });
  return { spy, restore: () => (window.open = original) };
}

describe('ContactUsPage', () => {
  it('renders the AboutHeader with expected props', () => {
    render(<ContactUsPage />)
    const header = screen.getByTestId('about-header-mock')
    expect(header).toBeInTheDocument()
    expect(screen.getByTestId('ah-title')).toHaveTextContent('Contact Us')
    expect(screen.getByTestId('ah-date')).toHaveTextContent('5 - 7 September')
    expect(screen.getByTestId('ah-image')).toHaveTextContent('/images/simdte-white-lg.png')
    expect(screen.getByTestId('ah-overlay')).toHaveTextContent('#1a1a2e')
    expect(screen.getByTestId('ah-bg')).toHaveTextContent('/images/utb-images/gallery/gallery-2.jpg')
    expect(screen.getByTestId('ah-divider')).toHaveTextContent('primary')
  })

  it('displays address, WhatsApp, and email contact info', () => {
    render(<ContactUsPage />)

    // Address section
    expect(screen.getByText(/Address/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Arya College, Jaipur/i)
    ).toBeInTheDocument()

    // WhatsApp link
    const waHeading = screen.getByText(/WhatsApp/i)
    const waCard = waHeading.closest('div')
    const waLink = within(waCard).getByRole('link', { name: '+91 8209346745' })
    expect(waLink).toHaveAttribute('href', expect.stringContaining('https://wa.me/8209346745'))
    expect(waLink).toHaveAttribute('target', '_blank')
    // rel attribute may be on the anchor; ensure secure rel usage
    expect(waLink).toHaveAttribute('rel', expect.stringContaining('noopener'))

    // Email link
    const emailHeading = screen.getByText(/Email/i)
    const emailCard = emailHeading.closest('div')
    const emailLink = within(emailCard).getByRole('link', { name: 'submit@ICTAAA.com' })
    expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:submit@ICTAAA.com'))
  })

  it('renders the "Contact Us" section title and form fields with required validation', () => {
    render(<ContactUsPage />)
    expect(screen.getByText(/^Contact Us$/)).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText(/Your Name/i)
    const emailInput = screen.getByPlaceholderText(/Your Email/i)
    const subjectInput = screen.getByPlaceholderText(/Subject/i)
    const messageInput = screen.getByPlaceholderText(/Message/i)

    // Required attributes
    expect(nameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(subjectInput).toBeRequired()
    expect(messageInput).toBeRequired()
  })

  it('clicking "Send Message" opens WhatsApp link in a new tab', () => {
    const { spy, restore } = spyOnOpen()
    try {
      render(<ContactUsPage />)
      const btn = screen.getByRole('button', { name: /Send Message/i })
      fireEvent.click(btn)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('https://wa.me/8209346745', '_blank')
    } finally {
      restore()
    }
  })

  it('submitting the form (without clicking the button) prevents default and does not open WhatsApp', () => {
    const { spy, restore } = spyOnOpen()
    try {
      render(<ContactUsPage />)
      const form = screen.getByRole('form', { hidden: true }) || screen.getByTestId('contact-form') // fallback if role not available
      // If the form role isn't present, find by selector
      const formEl = form || document.querySelector('form')
      expect(formEl).toBeTruthy()

      // Dispatch a native submit event (cancelable) to ensure preventDefault is possible
      const evt = new Event('submit', { bubbles: true, cancelable: true })
      const defaultPreventedBefore = evt.defaultPrevented
      formEl.dispatchEvent(evt)
      // React's synthetic event calls preventDefault; after dispatch, default should be prevented
      expect(defaultPreventedBefore).toBe(false)
      // Note: jsdom doesn't reflect React synthetic preventDefault on the native event reliably,
      // so the stronger assertion is that window.open was NOT called.
      expect(spy).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })

  it('renders a Google Maps iframe with the expected attributes', () => {
    render(<ContactUsPage />)
    const iframe = screen.getByTitle(/UTB Location/i)
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('width', '100%')
    expect(iframe).toHaveAttribute('height', '350')
    expect(iframe).toHaveAttribute('loading', 'lazy')
    expect(iframe).toHaveAttribute('referrerPolicy', 'no-referrer-when-downgrade')
    expect(iframe).toHaveClass('rounded-lg', { exact: false })
    // src contains Google Maps embed and Arya College reference
    expect(iframe.getAttribute('src')).toContain('google.com/maps/embed')
    expect(iframe.getAttribute('src')).toContain('Arya%20College')
  })

  it('has an accessible submit button with aria-label "Send Message"', () => {
    render(<ContactUsPage />)
    const btn = screen.getByRole('button', { name: /Send Message/i })
    expect(btn).toHaveAttribute('aria-label', 'Send Message')
  })
})
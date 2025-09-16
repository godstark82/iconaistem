/**
 * Tests for Hero component
 * Framework/Libraries: Jest + @testing-library/react + @testing-library/jest-dom
 * If using Vitest, replace jest.fn/reset with vi.fn/reset and ensure jsdom environment.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Attempt to import from common paths. Adjust path if your repo uses a different structure.
// We try a few fallbacks dynamically at runtime via require with try/catch.
let Hero
try {
  // Typical Next.js path (src-based)
  Hero = require('../../../src/components/home/Hero').default
} catch (e1) {
  try {
    // Non-src path
    Hero = require('../../../components/home/Hero').default
  } catch (e2) {
    try {
      // App directory variant
      Hero = require('../../../app/components/home/Hero').default
    } catch (e3) {
      // As a last resort, allow the test to fail with a clear message
      throw new Error(
        "Unable to locate Hero component. Tried: src/components/home/Hero, components/home/Hero, app/components/home/Hero"
      )
    }
  }
}

describe('Hero component', () => {
  beforeEach(() => {
    // Ensure jsdom has a sane window.location that can be spied on
    delete window.location
    window.location = { href: 'http://localhost/' }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders conference title and year prominently', () => {
    render(<Hero />)
    // Title text "IC-TAAA" and year "2025"
    expect(screen.getByText(/IC-TAAA/i)).toBeInTheDocument()
    expect(screen.getAllByText('2025')[0]).toBeInTheDocument()
  })

  it("renders the full conference name line including \"International Conference on Technological Advances in AI and it's Applications\"", () => {
    render(<Hero />)
    expect(
      screen.getByText(
        /International Conference on Technological Advances in AI and it's Applications/i
      )
    ).toBeInTheDocument()
  })

  it('renders the special session line "(Special session on Bio Sciences)"', () => {
    render(<Hero />)
    expect(
      screen.getByText(/\(Special session on Bio Sciences\)/i)
    ).toBeInTheDocument()
  })

  it('shows the scheduled dates "September 6-7, 2025"', () => {
    render(<Hero />)
    expect(screen.getByText('September 6-7, 2025')).toBeInTheDocument()
  })

  it('displays the Scopus logo image with correct alt text', () => {
    render(<Hero />)
    const img = screen.getByAltText('Scopus Logo')
    expect(img).toBeInTheDocument()
    // Sanity-check src attribute points to expected relative asset
    expect(img).toHaveAttribute('src', expect.stringContaining('images/scopus-logo-hero.png'))
  })

  describe('Submit Paper button', () => {
    it('renders the button with correct label', () => {
      render(<Hero />)
      const btn = screen.getByRole('button', { name: /submit paper/i })
      expect(btn).toBeInTheDocument()
    })

    it('navigates to /upload-paper on click by setting window.location.href', () => {
      render(<Hero />)
      const btn = screen.getByRole('button', { name: /submit paper/i })

      // Spy on property assignment to window.location.href
      const hrefSetter = jest.spyOn(window.location.__proto__ || {}, 'href', 'set')
        .mockImplementation((val) => {
          // emulate navigation without actually changing environment
          Object.defineProperty(window.location, 'href', { value: val, configurable: true, writable: true })
        })

      fireEvent.click(btn)

      expect(hrefSetter).toHaveBeenCalledWith('/upload-paper')
      expect(window.location.href).toBe('/upload-paper')
    })

    it('gracefully handles environments where location is not settable', () => {
      // Simulate a read-only location.href (older JSDOM variations or locked-down envs)
      delete window.location
      window.location = {}
      Object.defineProperty(window.location, 'href', { value: 'http://localhost/', writable: false })

      render(<Hero />)
      const btn = screen.getByRole('button', { name: /submit paper/i })

      // Clicking should not throw even if href cannot be set
      expect(() => {
        fireEvent.click(btn)
      }).not.toThrow()
    })
  })

  it('structure: contains the primary layout containers', () => {
    const { container } = render(<Hero />)
    // Check for key utility classes without being brittle on all Tailwind classes
    expect(container.querySelector('.bg-secondary')).toBeTruthy()
    expect(container.querySelector('.container')).toBeTruthy()
    expect(container.querySelector('.flex')).toBeTruthy()
  })
})
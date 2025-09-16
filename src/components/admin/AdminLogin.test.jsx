/* 
  Test framework: React Testing Library with project-configured runner (Jest or Vitest).
  These tests validate AdminLogin rendering, interaction, success/failure flows, and loading state.
*/
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * Support both Jest and Vitest without introducing new deps.
 * Prefer existing globals if present.
 */
/* eslint-disable no-undef */
const isVitest = typeof vi !== 'undefined'
const testRunner = isVitest ? vi : (typeof jest !== 'undefined' ? jest : undefined)
if (!testRunner || typeof testRunner.fn !== 'function') {
  throw new Error('No mock function available; ensure Jest or Vitest is configured.')
}


// Mock Firebase Auth module used by the component
testRunner.mock('firebase/auth', () => {
  return {
    getAuth: testRunner.fn(() => ({ app: 'mock-app' })),
    signInWithEmailAndPassword: testRunner.fn(), // per-test control via cast below
  }
})

// Import after mocks so the component uses the mocked module
import AdminLogin from './AdminLogin'
import * as FirebaseAuth from 'firebase/auth'

// Optional: userEvent if available in repo; fallback to fireEvent
let userEvent
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  userEvent = require('@testing-library/user-event').default
} catch {
  userEvent = null
}

const type = async (el, text) => {
  if (userEvent) {
    await userEvent.clear(el)
    await userEvent.type(el, text)
  } else {
    fireEvent.change(el, { target: { value: text } })
  }
}

describe('AdminLogin component', () => {
  beforeEach(() => {
    // Reset mocks between tests
    if (isVitest) {
      vi.clearAllMocks()
      vi.spyOn(console, 'error').mockImplementation(() => {})
    } else {
      jest.clearAllMocks()
      jest.spyOn(console, 'error').mockImplementation(() => {})
    }
  })

  afterEach(() => {
    // Restore console
    ;(console.error).mockRestore && (console.error).mockRestore()
  })

  test('renders headings, inputs and submit button', () => {
    const onLogin = testRunner.fn()
    render(<AdminLogin onLogin={onLogin} />)

    expect(screen.getByRole('heading', { name: /admin login/i })).toBeInTheDocument()
    expect(screen.getByText(/ICTAAA 2026 Administration Panel/i)).toBeInTheDocument()

    // Inputs by placeholder text
    const emailInput = screen.getByPlaceholderText(/email address/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')

    // Button initial state
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeInTheDocument()
    expect(submit).toBeEnabled()
  })

  test('successful login calls onLogin and toggles loading state', async () => {
    const onLogin = testRunner.fn()
    // Resolve the mocked signIn call
    ;(FirebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({ user: { uid: '123' } })

    render(<AdminLogin onLogin={onLogin} />)

    const emailInput = screen.getByPlaceholderText(/email address/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    await type(emailInput, 'admin@example.com')
    await type(passwordInput, 'CorrectHorseBatteryStaple')

    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeEnabled()

    // Submit: should show loading text and disable button
    userEvent ? await userEvent.click(submit) : fireEvent.click(submit)

    // While loading, text changes
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled()

    // Wait for the signIn promise to resolve and UI to settle
    await waitFor(() => expect(FirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledTimes(1))
    expect(FirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object), // auth
      'admin@example.com',
      'CorrectHorseBatteryStaple'
    )
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))

    // Button returns to normal label and enabled state
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()

    // No error message should be present
    expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument()
  })

  test('failed login shows error message, logs error, does not call onLogin', async () => {
    const onLogin = testRunner.fn()
    const fakeError = new Error('Auth failed')
    ;(FirebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(fakeError)

    render(<AdminLogin onLogin={onLogin} />)

    const emailInput = screen.getByPlaceholderText(/email address/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    await type(emailInput, 'admin@example.com')
    await type(passwordInput, 'wrong-password')

    const submit = screen.getByRole('button', { name: /sign in/i })
    userEvent ? await userEvent.click(submit) : fireEvent.click(submit)

    // Loading state visible initially
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled()

    // After rejection: error shown, button re-enabled, onLogin not called
    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument())
    expect(onLogin).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()

    // console.error should have been called with the error
    expect(console.error).toHaveBeenCalled()
  })

  test('prevents repeat submissions while loading (button disabled)', async () => {
    const onLogin = testRunner.fn()
    // Create a promise that we resolve later to simulate slow network
    let resolvePromise
    const pending = new Promise((res) => { resolvePromise = res })
    ;(FirebaseAuth.signInWithEmailAndPassword).mockReturnValueOnce(pending)

    render(<AdminLogin onLogin={onLogin} />)

    const emailInput = screen.getByPlaceholderText(/email address/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    await type(emailInput, 'admin@example.com')
    await type(passwordInput, 'any-password')

    const submit = screen.getByRole('button', { name: /sign in/i })

    // First click starts loading
    userEvent ? await userEvent.click(submit) : fireEvent.click(submit)
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled()

    // Try to click again during loading; should not trigger extra calls
    userEvent ? await userEvent.click(screen.getByRole('button', { name: /signing in\.\.\./i })) : fireEvent.click(screen.getByRole('button', { name: /signing in\.\.\./i }))
    expect(FirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledTimes(1)

    // Resolve pending promise to finish
    resolvePromise && resolvePromise({ user: { uid: '123' } })
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
  })

  test('input values are controlled and update on change', async () => {
    const onLogin = testRunner.fn()
    render(<AdminLogin onLogin={onLogin} />)

    const emailInput = screen.getByPlaceholderText(/email address/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)

    await type(emailInput, 'user@site.com')
    await type(passwordInput, 'p4ssw0rd\!')

    expect(emailInput).toHaveValue('user@site.com')
    expect(passwordInput).toHaveValue('p4ssw0rd\!')
  })
})
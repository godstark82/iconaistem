/**
 * AdminLogin component tests
 *
 * Testing framework and libraries:
 * - Jest
 * - React Testing Library (@testing-library/react)
 * - @testing-library/jest-dom (imported locally for matchers)
 *
 * Focus: Validate the behavior introduced/modified in the component:
 * - Successful sign-in triggers onLogin and toggles loading state.
 * - Failed sign-in shows error message, logs error, and re-enables submit.
 * - Error is cleared on re-submit and success path proceeds.
 * - getAuth is invoked and its instance is passed to signInWithEmailAndPassword.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from '../../../src/components/admin/AdminLogin.jsx';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ app: 'mock-app' })),
  signInWithEmailAndPassword: jest.fn(),
}));

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

function setup(overrides = {}) {
  const onLogin = overrides.onLogin || jest.fn();
  render(<AdminLogin onLogin={onLogin} />);
  const email = screen.getByPlaceholderText(/email address/i);
  const password = screen.getByPlaceholderText(/password/i);
  const submit = screen.getByRole('button', { name: /sign in/i });
  return { email, password, submit, onLogin };
}

let consoleErrorSpy;

beforeEach(() => {
  jest.clearAllMocks();
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('AdminLogin', () => {
  test('renders title, subtitle, and inputs with initial state', () => {
    const { email, password, submit } = setup();

    expect(screen.getByRole('heading', { name: /admin login/i })).toBeInTheDocument();
    expect(screen.getByText(/ictaaa 2026 administration panel/i)).toBeInTheDocument();

    expect(email).toHaveValue('');
    expect(password).toHaveValue('');
    expect(submit).toBeEnabled();

    // getAuth called on initial render
    expect(getAuth).toHaveBeenCalledTimes(1);
  });

  test('submits with credentials, calls signIn and then onLogin on success', async () => {
    const { email, password, submit, onLogin } = setup();

    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } });

    fireEvent.change(email, { target: { value: 'admin@example.com' } });
    fireEvent.change(password, { target: { value: 's3cr3t' } });

    fireEvent.click(submit);

    // Loading state visible and button disabled
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();

    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1));

    // Ensure auth instance from getAuth is passed through
    const authInstance = getAuth.mock.results[0]?.value;
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      authInstance,
      'admin@example.com',
      's3cr3t'
    );

    // onLogin called after successful sign in
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));

    // Loading ends and button text restored
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
    );

    // No error shown
    expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
  });

  test('shows error and does not call onLogin when sign-in fails', async () => {
    const { email, password, submit, onLogin } = setup();

    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Auth failed'));

    fireEvent.change(email, { target: { value: 'wrong@example.com' } });
    fireEvent.change(password, { target: { value: 'badpass' } });

    fireEvent.click(submit);

    // Button disabled while loading
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();

    // Error message appears
    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );

    // onLogin not called
    expect(onLogin).not.toHaveBeenCalled();

    // Error logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Loading ends and button re-enabled
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
    );
  });

  test('clears previous error on re-submit and succeeds on next attempt', async () => {
    const { email, password, submit, onLogin } = setup();

    // First attempt fails
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('nope'));
    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: 'first' } });
    fireEvent.click(submit);

    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );

    // Second attempt succeeds
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'abc' } });
    fireEvent.change(password, { target: { value: 'second' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in|signing in/i }));

    // Error cleared after new submit at the latest by success completion
    await waitFor(() =>
      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument()
    );

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
  });
});
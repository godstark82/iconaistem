/**
 * Tests for RegistrationPage
 * - Framework: Jest + React Testing Library (expected by most Next.js repos)
 * - Mocks:
 *    • "@/components/ui/dialog" mocked as a virtual module to avoid alias resolution issues
 *    • "../../components/common/AboutHeader" mocked to a simple placeholder
 *    • RegistrationSchema.parse mocked to control validation outcomes
 *    • global.fetch mocked for API interactions
 *    • global.z with ZodError class to exercise validation-error branch
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Virtual mock for shadcn dialog components (handles `open` prop for conditional rendering)
jest.mock('@/components/ui/dialog', () => {
  const React = require('react');

  const Dialog = ({ open, onOpenChange, children, ...rest }) =>
    React.createElement('div', { 'data-testid': 'dialog-root', 'data-open': !!open, ...rest }, open ? children : null);

  const DialogTrigger = ({ asChild = false, children }) =>
    React.createElement(React.Fragment, null, children);

  const DialogContent = ({ children, ...rest }) =>
    React.createElement('div', { 'data-testid': 'dialog-content', ...rest }, children);

  const DialogHeader = ({ children }) => React.createElement('div', null, children);
  const DialogTitle = ({ children }) => React.createElement('h2', null, children);
  const DialogDescription = ({ asChild = false, children }) => React.createElement('div', null, children);
  const DialogFooter = ({ children, ...rest }) => React.createElement('div', rest, children);
  const DialogClose = ({ asChild = false, children }) => React.createElement(React.Fragment, null, children);

  return {
    __esModule: true,
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  };
}, { virtual: true });

// Mock AboutHeader to a stub
jest.mock('../../components/common/AboutHeader', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'about-header' }),
  };
}, { virtual: true });

// Mock RegistrationSchema to control validation parsing
jest.mock('../../schema/registration-schema', () => {
  return {
    __esModule: true,
    RegistrationSchema: {
      parse: jest.fn((v) => v), // default: echo back valid data
    },
  };
});

// Provide a global `z.ZodError` to satisfy `instanceof z.ZodError` checks in the component
beforeAll(() => {
  // Create a simple ZodError-like class
  class ZodError extends Error {

    constructor(errors) {
      super('Zod validation error');
      this.name = 'ZodError';
      this.errors = errors || [];
    }
  }
  global.z = { ZodError };
});

afterAll(() => {
  delete global.z;
});

// Mock fetch globally for each test
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.clearAllMocks();
});
afterAll(() => {
  global.fetch = originalFetch;
});

// Import the component under test AFTER mocks so they apply
import RegistrationPage from '../page.test.jsx'; // The provided file path in the PR context

const fillBasicForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Payment ID (required)'), { target: { value: 'PAY-123' } });
  fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByPlaceholderText('Affiliation'), { target: { value: 'ACME Corp' } });
  fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'USA' } });
  fireEvent.change(screen.getByDisplayValue('Select Category'), { target: { value: 'Faculty' } });
  fireEvent.change(screen.getByDisplayValue('Select Days Attending'), { target: { value: 'Both Days' } });
};

describe('RegistrationPage UI rendering', () => {
  test('renders headers, notes, and form sections', () => {
    render(<RegistrationPage />);
    expect(screen.getByTestId('about-header')).toBeInTheDocument();
    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByText('Registration Form')).toBeInTheDocument();
    expect(screen.getByText('Please complete the payment first and enter the payment ID in the registration form below.')).toBeInTheDocument();
  });

  test('renders all India and Non-India price cards with correct counts', () => {
    render(<RegistrationPage />);
    // India: 4 cards
    expect(screen.getByText('Fees Details: For India')).toBeInTheDocument();
    const indiaLabels = [
      'Participation and Certificate (without Paper)',
      'Participation and Certificate (with Paper presentation)',
      'Participation and Certificate (with Paper publication in Peer Review Journals)',
      'Participation and Certificate (with Paper publication in SCOPUS Proceedings/SCOPUS Journal: Peer Review Journals)',
    ];
    const indiaPrices = ['₹500', '₹1000', '₹2000', '₹1000 + Publication Charges'];
    indiaLabels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    indiaPrices.forEach((price) => expect(screen.getByText(price)).toBeInTheDocument());

    // Non-India: 3 cards
    expect(screen.getByText('Fees Details: For Non-India Participants')).toBeInTheDocument();
    const nonIndiaLabels = [
      'Participation with certificate',
      'Participation with publications in SCOPUS Proceedings',
      'Participation with publications in SCOPUS Journals',
    ];
    const nonIndiaPrices = ['$25', '$120', '$20 + APC of the Journal'];
    nonIndiaLabels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    nonIndiaPrices.forEach((price) => expect(screen.getByText(price)).toBeInTheDocument());
  });
});

describe('Payment dialog interactions', () => {
  test('dialog is closed by default and opens on clicking Make Payment', () => {
    render(<RegistrationPage />);
    // Our Dialog mock hides children unless open is true; ensure contents not present initially
    expect(screen.queryByText('Bank Payment Details')).not.toBeInTheDocument();

    const makePaymentBtn = screen.getByRole('button', { name: /make payment/i });
    fireEvent.click(makePaymentBtn);

    // Now the dialog contents should render
    expect(screen.getByText('Bank Payment Details')).toBeInTheDocument();
    expect(screen.getByText(/Account Number:/i)).toBeInTheDocument();
  });
});

describe('Form submission validations and flows', () => {
  test('shows error if submitting without paymentIntentId', async () => {
    render(<RegistrationPage />);
    // Submit with empty Payment ID
    const submitBtn = screen.getByRole('button', { name: /submit registration/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please complete the payment first before submitting registration.')).toBeInTheDocument();
    // Ensure no network calls were made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('successful submission posts to registration and mailer, shows success dialog, and clears form', async () => {
    const { RegistrationSchema } = jest.requireMock('../../schema/registration-schema');

    // First fetch: /api/registration -> ok: true
    // Second fetch: /api/mailer -> ok: true
    global.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    render(<RegistrationPage />);
    // Ensure dialog remains closed until opened
    expect(screen.queryByText('Registration Successful!')).not.toBeInTheDocument();

    // Fill form
    fillBasicForm();
    // Toggle checkbox
    const checkbox = screen.getByRole('checkbox', { name: /will you be presenting a paper/i });
    fireEvent.click(checkbox); // true

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    // Wait for success dialog
    expect(await screen.findByText('Registration Successful!')).toBeInTheDocument();

    // Assert registration API call
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/registration', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    }));

    // Body should reflect validated data (echoed by our mock Schema.parse)
    const firstBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(firstBody).toMatchObject({
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      affiliation: 'ACME Corp',
      country: 'USA',
      category: 'Faculty',
      daysAttending: 'Both Days',
      presentingPaper: true,
      paymentIntentId: 'PAY-123',
    });

    // Assert mailer API call with correctly composed email text
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/mailer', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    }));
    const mailBody = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(mailBody).toMatchObject({
      to: 'john@example.com',
      subject: 'Registration Confirmation - ICTAAA 2026',
    });
    expect(mailBody.text).toContain('Dear John Doe');
    expect(mailBody.text).toContain('Thank you for registering for ICTAAA 2026.');
    expect(mailBody.text).toContain('Presenting Paper: Yes');
    expect(mailBody.text).toContain('Payment ID: PAY-123');

    // After success, form should reset
    expect(screen.getByPlaceholderText('Payment ID (required)')).toHaveValue('');
    expect(screen.getByPlaceholderText('Full Name')).toHaveValue('');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Phone')).toHaveValue('');
    expect(screen.getByPlaceholderText('Affiliation')).toHaveValue('');
    expect(screen.getByPlaceholderText('Country')).toHaveValue('');
  });

  test('handles server error by showing status message (non-OK registration response)', async () => {
    const { RegistrationSchema } = jest.requireMock('../../schema/registration-schema');
    // Ensure parse succeeds
    RegistrationSchema.parse.mockImplementation((v) => v);

    // First fetch returns 500 triggering thrown Error in component
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ ok: false }) });

    render(<RegistrationPage />);

    fillBasicForm();

    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    // Expect an error status rendered (from catch branch)
    // The component composes: `Error: HTTP error! status: 500`
    await waitFor(() => {
      expect(screen.getByText(/Error: HTTP error! status: 500/)).toBeInTheDocument();
    });

    // Mailer should not be called when registration fails
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('shows validation error message from ZodError when schema parsing fails', async () => {
    const { RegistrationSchema } = jest.requireMock('../../schema/registration-schema');

    // Make parse throw a ZodError-like error with expected `errors` shape
    RegistrationSchema.parse.mockImplementation(() => {
      throw new global.z.ZodError([
        { path: ['email'], message: 'Invalid email' },
        { path: ['phone'], message: 'Invalid phone' },
      ]);
    });

    render(<RegistrationPage />);

    fillBasicForm();
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    // Expect a combined validation error status
    await waitFor(() => {
      expect(
        screen.getByText(/Validation error: email: Invalid email, phone: Invalid phone/)
      ).toBeInTheDocument();
    });

    // No network calls should be made because validation failed before fetch
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
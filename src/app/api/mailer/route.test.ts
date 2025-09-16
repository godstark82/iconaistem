/**
 * Tests for src/app/api/mailer/route.ts
 *
 * Framework: Jest (preferred if present in repository). If the project uses Vitest,
 *            replace jest.* with vi.* and jest.mock with vi.mock accordingly.
 *
 * Scenarios covered:
 *  - 200 success with valid payload; verifies sendMail called with attribution appended
 *  - 400 when any required field is missing (to, subject, text)
 *  - 500 when transporter.sendMail throws/rejects; verifies error shape
 *  - Verifies "from" constructed using process.env.EMAIL_USER
 *  - Verifies nodemailer.createTransport called with expected SMTP config and auth from env
 *
 * Notes:
 *  - We reset modules between tests to ensure the module-level transporter is rebuilt with the current env.
 *  - We mock 'nodemailer' before importing the route module to intercept createTransport and sendMail.
 */

import { type Mock } from 'jest-mock';

// Hoisted mocks/state we can tweak per-test
const sendMailMock: Mock = jest.fn();
const createTransportMock: Mock = jest.fn(() => ({ sendMail: sendMailMock }));

// Mock nodemailer with default export and named export compatibility
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}));

// Helper to (re)import POST after setting env/mocks
async function importRoute() {
  // Ensure fresh module instance for each test so module-level transporter uses current env
  jest.resetModules();
  return await import('./route');
}

describe('POST /api/mailer', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.useRealTimers();
    // Fresh env for each test
    process.env = { ...ORIGINAL_ENV };
    process.env.EMAIL_USER = 'noreply@example.com';
    process.env.EMAIL_PASSWORD = 's3cr3t';
    // Reset mocks
    sendMailMock.mockReset();
    createTransportMock.mockClear();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('returns 200 and sends email with attribution appended (happy path)', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: 'abc123' });
    const { POST } = await importRoute();

    const payload = { to: 'user@dest.com', subject: 'Hello', text: 'Body text' };
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    // Assert Response status and body
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'Email sent successfully' });

    // createTransport called once with expected SMTP settings and env auth
    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // sendMail called with expected mail options
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg).toMatchObject({
      from: `ICTAAA <${process.env.EMAIL_USER}>`,
      to: payload.to,
      subject: payload.subject,
    });
    // Verify attribution is appended to the text body
    expect(callArg.text).toContain('Body text');
    expect(callArg.text).toContain('Mail Sent by');
    expect(callArg.text).toContain('https://mailofly.redevs.atmam.org');
  });

  test('returns 400 when "to" is missing', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: 'should-not-be-called' });
    const { POST } = await importRoute();

    const payload = { subject: 'No recipient', text: 'Hi' } as any;
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Missing required fields' });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('returns 400 when "subject" is missing', async () => {
    const { POST } = await importRoute();

    const payload = { to: 'user@dest.com', text: 'Hi' } as any;
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Missing required fields' });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('returns 400 when "text" is missing', async () => {
    const { POST } = await importRoute();

    const payload = { to: 'user@dest.com', subject: 'Hi' } as any;
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Missing required fields' });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('returns 200 and preserves attribution even when text ends with newline', async () => {
    sendMailMock.mockResolvedValueOnce({});
    const { POST } = await importRoute();
    const payload = { to: 'u@d.com', subject: 'S', text: 'Line 1\n' };
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const { text } = sendMailMock.mock.calls[0][0];
    expect(text).toMatch(/Line 1\n/);
    expect(text).toMatch(/--\nMail Sent by/);
  });

  test('returns 500 with error message when sendMail throws', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP fail'));
    const { POST } = await importRoute();

    const payload = { to: 'user@dest.com', subject: 'Hello', text: 'Body text' };
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    // The implementation concatenates the error; ensure it contains the message
    expect(json.error).toContain('Failed to send email');
    expect(json.error).toContain('SMTP fail');
  });

  test('uses EMAIL_USER from env for "from" field', async () => {
    process.env.EMAIL_USER = 'customsender@example.org';
    sendMailMock.mockResolvedValueOnce({});
    const { POST } = await importRoute();

    const payload = { to: 'user@dest.com', subject: 'Subject', text: 'Body' };
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await POST(req);

    const args = sendMailMock.mock.calls[0][0];
    expect(args.from).toBe(`ICTAAA <${process.env.EMAIL_USER}>`);
  });

  test('initializes transporter with secure hostinger SMTP config', async () => {
    sendMailMock.mockResolvedValueOnce({});
    const { POST } = await importRoute();

    const payload = { to: 'a@b.com', subject: 'x', text: 'y' };
    const req = new Request('http://localhost/api/mailer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await POST(req);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  });
});
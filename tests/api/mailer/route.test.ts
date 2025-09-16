/**
 * Tests for app/api/mailer/route.ts
 * Framework: Jest (ts-jest) or Vitest in Jest-compat mode. Adjust imports if using Vitest.
 * These tests mock 'nodemailer' transport and exercise the POST handler with various inputs.
 */

import { NextResponse } from 'next/server';

// Mock nodemailer transport
jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
  return {
    __esModule: true,
    default: {
      createTransport: jest.fn(() => ({ sendMail }))
    },
  };
});

import nodemailer from 'nodemailer';

// Important: Set env BEFORE importing the route, since transporter is created at module scope.
const EMAIL_USER = 'sender@example.com';
const EMAIL_PASSWORD = 'secret';
process.env.EMAIL_USER = EMAIL_USER;
process.env.EMAIL_PASSWORD = EMAIL_PASSWORD;

// Import the handler under test. Adjust path if your route file lives elsewhere.
import { POST } from '../../../app/api/mailer/route';

type JsonBody = { to?: string; subject?: string; text?: string; [k: string]: unknown };

function makeRequest(body: JsonBody | string, init: RequestInit = {}) {
  const isString = typeof body === 'string';
  return new Request('http://localhost/api/mailer', {
    method: 'POST',
    headers: isString ? { 'content-type': 'text/plain' } : { 'content-type': 'application/json' },
    body: isString ? (body as string) : JSON.stringify(body),
    ...init,
  });
}

async function json(res: Response) {
  const clone = res.clone();
  try {
    return await clone.json();
  } catch {
    const text = await clone.text();
    return { raw: text };
  }
}

describe('POST /api/mailer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const req = makeRequest({ to: 'a@b.com', subject: 'Hi' }); // missing text
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    const data = await json(res as unknown as Response);
    expect(data).toEqual({ error: 'Missing required fields' });
    expect((nodemailer as any).default.createTransport).toHaveBeenCalledTimes(1);
    // sendMail should not be called on validation failure
    const transport = (nodemailer as any).default.createTransport.mock.results[0].value;
    expect(transport.sendMail).not.toHaveBeenCalled();
  });

  it('sends email and returns 200 on valid payload, appending Mailofly attribution', async () => {
    const payload = { to: 'rcpt@example.com', subject: 'Subject', text: 'Body text' };
    const req = makeRequest(payload);
    const res = await POST(req as unknown as Request);

    expect(res.status).toBe(200);
    const data = await json(res as unknown as Response);
    expect(data).toEqual({ message: 'Email sent successfully' });

    // Verify transporter configured with env creds
    expect((nodemailer as any).default.createTransport).toHaveBeenCalledWith({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
    });

    // Verify sendMail called with correct fields and attribution appended
    const transport = (nodemailer as any).default.createTransport.mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    const arg = transport.sendMail.mock.calls[0][0];

    expect(arg.from).toBe(`ICTAAA <${EMAIL_USER}>`);
    expect(arg.to).toBe(payload.to);
    expect(arg.subject).toBe(payload.subject);
    expect(typeof arg.text).toBe('string');
    expect(arg.text).toContain(payload.text);
    expect(arg.text).toContain('Mail Sent by <a href="https://mailofly.redevs.atmam.org"');
    // Ensure attribution is appended at the end
    expect(arg.text.endsWith('\n\n--\nMail Sent by <a href="https://mailofly.redevs.atmam.org" target="_blank" rel="noopener noreferrer">Mailofly</a>')).toBe(true);
  });

  it('propagates 500 when transporter.sendMail throws', async () => {
    const transport = { sendMail: jest.fn().mockRejectedValue(new Error('SMTP down')) };
    (nodemailer as any).default.createTransport.mockReturnValueOnce(transport);

    const req = makeRequest({ to: 'x@y.com', subject: 'S', text: 'T' });
    const res = await POST(req as unknown as Request);

    expect(res.status).toBe(500);
    const data = await json(res as unknown as Response);
    expect(String(data.error)).toMatch(/Failed to send email/i);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });

  it('handles non-JSON body by returning 500 with error message', async () => {
    // req.json() will reject for text/plain
    const req = makeRequest('not-json-string');
    const res = await POST(req as unknown as Request);
    expect([400,500]).toContain(res.status); // Implementation returns 500 in catch
    const data = await json(res as unknown as Response);
    expect(String(data.error)).toMatch(/Failed to send email|Missing required fields/);
  });

  it('ignores extra fields and still sends email', async () => {
    const payload: JsonBody = { to: 'rcpt@example.com', subject: 'Sub', text: 'Txt', extra: 'ignored' };
    const req = makeRequest(payload);
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);

    const transport = (nodemailer as any).default.createTransport.mock.results[0].value;
    const arg = transport.sendMail.mock.calls[0][0];
    expect(arg).not.toHaveProperty('extra');
  });

  it('uses the correct "from" format with EMAIL_USER env', async () => {
    const req = makeRequest({ to: 'rcpt@example.com', subject: 'Env', text: 'Check from' });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    const transport = (nodemailer as any).default.createTransport.mock.results[0].value;
    const arg = transport.sendMail.mock.calls[0][0];
    expect(arg.from).toBe(`ICTAAA <${EMAIL_USER}>`);
  });
});
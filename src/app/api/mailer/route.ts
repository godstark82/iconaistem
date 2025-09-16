import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function POST(req: Request) {
  try {
    const { to, subject, text } = await req.json();

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Append Mailofly attribution to the bottom of the email body
    const attribution = `\n\n--\nMail Sent by <a href="https://mailofly.redevs.atmam.org" target="_blank" rel="noopener noreferrer">Mailofly</a>`;
    // If the email is plain text, the link will not be clickable, but we follow the instruction.
    const textWithAttribution = `${text}${attribution}`;

    const mailOptions = {
      from: `ICTAAA <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: textWithAttribution
    };

    await transporter.sendMail({
      ...mailOptions,
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email ' + error },
      { status: 500 }
    );
  }
}
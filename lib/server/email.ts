import 'server-only';

import { serverEnv } from '@/lib/server/env';

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Sends through Resend's HTTP API (no SDK). Without `RESEND_API_KEY`/`EMAIL_FROM` the
 * email is printed to the server log so sign-up and password reset stay testable
 * locally; in production that configuration gap throws instead, because a reset link
 * that only reaches a log file locks the user out.
 */
export async function sendEmail(email: OutgoingEmail): Promise<void> {
  if (!serverEnv.RESEND_API_KEY || !serverEnv.EMAIL_FROM) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email is not configured: set RESEND_API_KEY and EMAIL_FROM.');
    }

    console.info(
      `[email] not sent (no RESEND_API_KEY) → ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`,
    );
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: serverEnv.EMAIL_FROM,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
  }
}

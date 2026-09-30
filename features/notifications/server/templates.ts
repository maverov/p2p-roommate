import 'server-only';

import { createTranslator } from 'next-intl';

import { APP_TIME_ZONE, defaultLocale, isLocale, type Locale } from '@/lib/i18n';
import type { OutgoingEmail } from '@/lib/server/email';
import { getMessages } from '@/locales';

/** Stored locales are free text (Better Auth only checks the type), so fall back safely. */
export function emailLocale(value: string | null | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

export function emailTranslator(locale: Locale) {
  return createTranslator({
    locale,
    messages: getMessages(locale),
    namespace: 'emails',
    timeZone: APP_TIME_ZONE,
  });
}

type EmailContent = {
  to: string;
  locale: Locale;
  subject: string;
  heading: string;
  paragraphs: string[];
  /** User-written text (a message, a request note), shown set apart and escaped. */
  quote?: string | null;
  action: { label: string; url: string };
  footnote?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * One table-based layout for every email: inline styles only, because most mail
 * clients strip `<style>` blocks. Every interpolated value is escaped — subjects and
 * quotes carry user-written names, titles and messages.
 */
export function renderEmail(content: EmailContent): OutgoingEmail {
  const t = emailTranslator(content.locale);
  const paragraphs = content.paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#303329">${escapeHtml(text)}</p>`,
    )
    .join('');
  const quote = content.quote
    ? `<blockquote style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #c85b36;background:#fffaf2;font-size:15px;line-height:22px;color:#303329;white-space:pre-wrap">${escapeHtml(content.quote)}</blockquote>`
    : '';
  const footnote = content.footnote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:19px;color:#4f5148">${escapeHtml(content.footnote)}</p>`
    : '';
  const url = escapeHtml(content.action.url);

  const html = `<!doctype html>
<html lang="${content.locale}">
<body style="margin:0;padding:0;background:#fdf8f0;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f0;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8dfd2;border-radius:12px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-size:22px;font-weight:bold;color:#c85b36">stay<span style="color:#303329">.bg</span></p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:28px;color:#303329">${escapeHtml(content.heading)}</h1>
${paragraphs}${quote}
<p style="margin:8px 0 24px"><a href="${url}" style="display:inline-block;background:#c85b36;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 20px;border-radius:8px">${escapeHtml(content.action.label)}</a></p>
<p style="margin:0;font-size:13px;line-height:19px;color:#4f5148">${escapeHtml(t('layout.linkFallback'))}<br><a href="${url}" style="color:#c85b36;word-break:break-all">${url}</a></p>
${footnote}
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#4f5148">${escapeHtml(t('layout.footer'))}</p>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    '',
    ...content.paragraphs,
    ...(content.quote ? ['', content.quote] : []),
    '',
    `${content.action.label}: ${content.action.url}`,
    ...(content.footnote ? ['', content.footnote] : []),
    '',
    '—',
    t('layout.footer'),
  ].join('\n');

  return { to: content.to, subject: content.subject, html, text };
}

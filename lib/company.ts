/**
 * Public contact addresses, read by the contact and press pages and the Organization
 * structured data.
 *
 * PLACEHOLDERS until the real mailboxes exist (see LAUNCH_CHECKLIST.txt): changing an
 * address here updates every page that shows it.
 */
export const CONTACT_EMAILS = {
  support: 'support@stay.bg',
  safety: 'safety@stay.bg',
  press: 'press@stay.bg',
  partners: 'partners@stay.bg',
} as const;

export type ContactChannel = keyof typeof CONTACT_EMAILS;

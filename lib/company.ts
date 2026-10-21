/**
 * Public contact addresses, read by the contact and press pages and the Organization
 * structured data.
 *
 * PLACEHOLDERS until the real mailboxes exist (see LAUNCH_CHECKLIST.txt): changing an
 * address here updates every page that shows it.
 */
export const CONTACT_EMAILS = {
  support: 'support@rentbee.bg',
  safety: 'safety@rentbee.bg',
  press: 'press@rentbee.bg',
  partners: 'partners@rentbee.bg',
} as const;

export type ContactChannel = keyof typeof CONTACT_EMAILS;

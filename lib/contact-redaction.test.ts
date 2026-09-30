import { describe, expect, it } from 'vitest';

import { redactContactDetails } from './contact-redaction';

const HIDDEN = '[hidden]';
const redact = (text: string) => redactContactDetails(text, HIDDEN);

describe('redactContactDetails', () => {
  it.each([
    ['a mobile number with spaces', 'Call 0888 123 456 after six', 'Call [hidden] after six'],
    ['a mobile number without spaces', 'тел. 0888123456', 'тел. [hidden]'],
    ['an international number', 'WhatsApp +359 88 123 4567', 'WhatsApp [hidden]'],
    ['a 00-prefixed number', 'Call 00359 88 123 4567', 'Call [hidden]'],
    ['a country code without +', 'Tel 359 888 123 456', 'Tel [hidden]'],
    ['a Sofia landline', '02 981 2345', '[hidden]'],
    ['a number with dashes and slashes', '0888/12-34-56', '[hidden]'],
    ['an email address', 'Write to ana.petrova+rooms@mail.example.bg', 'Write to [hidden]'],
  ])('masks %s', (_label, input, expected) => {
    expect(redact(input)).toBe(expected);
  });

  it.each([
    ['a price', 'Rent 1200 € per month, deposit 600 €'],
    ['a size and floor', '65 sq m on floor 4 of 8'],
    ['a year', 'Renovated in 2024'],
    ['a dotted date', 'Available from 01.10.2026'],
    ['a short code', 'Entrance 012, apartment 07'],
    ['a street number range', 'Block 305, entrance B'],
  ])('leaves %s alone', (_label, input) => {
    expect(redact(input)).toBe(input);
  });

  it('masks every occurrence', () => {
    expect(redact('0888 123 456 or 0899 765 432, or me@example.com')).toBe(
      '[hidden] or [hidden], or [hidden]',
    );
  });
});

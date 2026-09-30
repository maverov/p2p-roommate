import { describe, expect, it } from 'vitest';

import { serializeJsonLd } from './jsonld';

describe('serializeJsonLd', () => {
  const hostile = { name: '</script><script>alert(1)</script>', description: 'a < b' };

  it('never emits a raw "<", so user text cannot close the script tag', () => {
    expect(serializeJsonLd(hostile)).not.toContain('<');
  });

  it('parses back to exactly the input', () => {
    expect(JSON.parse(serializeJsonLd(hostile))).toEqual(hostile);
  });
});

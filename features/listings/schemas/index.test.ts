import { describe, expect, it } from 'vitest';

import { createListingInputSchema, listingImageInputSchema, updateListingInputSchema } from '.';

describe('listing currency', () => {
  const currency = createListingInputSchema.shape.currency;

  it('defaults to EUR on create', () => {
    expect(currency.parse(undefined)).toBe('EUR');
  });

  it('normalises case and whitespace', () => {
    expect(currency.parse(' eur ')).toBe('EUR');
  });

  it('rejects any other currency', () => {
    expect(currency.safeParse('BGN').success).toBe(false);
  });

  it('is left alone by a partial update that omits it', () => {
    expect(updateListingInputSchema.parse({})).not.toHaveProperty('currency');
  });
});

describe('listing images', () => {
  it('accepts an uploaded photo', () => {
    const image = {
      url: 'https://abc.public.blob.vercel-storage.com/listings/a.jpg',
      alt: 'Living room',
    };

    expect(listingImageInputSchema.safeParse(image).success).toBe(true);
  });

  it('rejects an external image URL', () => {
    const image = { url: 'https://example.com/a.jpg', alt: 'Living room' };

    expect(listingImageInputSchema.safeParse(image).success).toBe(false);
  });
});

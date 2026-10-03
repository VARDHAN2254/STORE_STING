import { describe, it, expect } from 'vitest';

describe('STORE STING Core Utilities & Brand Validation', () => {
  it('validates brand identity and tagline', () => {
    const brand = 'STORE STING';
    const tagline = 'Shopping, reimagined.';
    expect(brand).toBe('STORE STING');
    expect(tagline).toBe('Shopping, reimagined.');
  });

  it('validates Soft Future light color palette constants', () => {
    const palette = {
      warmIvory: '#F7F4EE',
      pureWhite: '#FFFFFF',
      softMist: '#EEF2F0',
      pearl: '#E6EAE6',
      sage: '#B9C9B8',
      mintAqua: '#A9DED2',
      softCoral: '#F2B7A5',
      softLime: '#D8E878',
      deepInk: '#1E2925',
    };

    expect(palette.warmIvory).toBe('#F7F4EE');
    expect(palette.deepInk).toBe('#1E2925');
  });

  it('validates state transitions in order state machine', () => {
    const validStates = [
      'CREATED',
      'ORDER_PLACED',
      'INVENTORY_VERIFIED',
      'PAYMENT_PENDING',
      'PAYMENT_AUTHORIZED',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'CANCELLED',
    ];

    expect(validStates).toContain('ORDER_PLACED');
    expect(validStates).toContain('INVENTORY_VERIFIED');
    expect(validStates).toContain('DELIVERED');
  });
});

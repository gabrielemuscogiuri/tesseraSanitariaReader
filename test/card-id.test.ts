import { describe, expect, it } from 'vitest';
import { calculateCardId, calculateLuhn } from '../src/parse.js';

describe('calculateLuhn', () => {
  it('computes the TS-CNS check digit from the right without doubling the last payload digit', () => {
    expect(calculateLuhn('7992739871')).toBe(4);
    expect(calculateLuhn('0')).toBe(0);
  });
});

describe('calculateCardId', () => {
  it('builds a 20-digit number with prefix, stem and Luhn digit', () => {
    const raw = Buffer.from('X123456789012');
    const cardId = calculateCardId(raw);
    const stem = '8038000123456789012';

    expect(cardId).toHaveLength(20);
    expect(cardId.startsWith('8038000')).toBe(true);
    expect(cardId).toBe(`${stem}${calculateLuhn(stem)}`);
    expect(/^\d{20}$/.test(cardId)).toBe(true);
  });
});

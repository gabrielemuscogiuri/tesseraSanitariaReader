import { describe, expect, it } from 'vitest';
import { omitEmpty, parsePersonalData } from '../src/parse.js';

const encodeLength = (n: number, width: number): string =>
  n.toString(16).toUpperCase().padStart(width, '0');

const encodePersonalData = (fields: readonly string[]): Buffer => {
  const payload = fields
    .map((value) => `${encodeLength(Buffer.byteLength(value, 'latin1'), 2)}${value}`)
    .join('');
  const header = encodeLength(Buffer.byteLength(payload, 'latin1'), 6);
  return Buffer.from(`${header}${payload}`, 'latin1');
};

const SYNTHETIC_FIELDS = [
  '6160',
  '01012020',
  '31122030',
  'ROSSI',
  'MARIO',
  '15031980',
  'M',
  '',
  'RSSMRA80C15L419X',
  '',
  'L419',
  '',
  '',
  'L074',
  '',
  '',
] as const;

describe('parsePersonalData', () => {
  it('parses TLV fields and formats dates as DD-MM-YYYY', () => {
    const parsed = parsePersonalData(encodePersonalData(SYNTHETIC_FIELDS));

    expect(parsed.issuer).toBe('6160');
    expect(parsed.issue_date).toBe('01-01-2020');
    expect(parsed.expiration_date).toBe('31-12-2030');
    expect(parsed.surname).toBe('ROSSI');
    expect(parsed.given_name).toBe('MARIO');
    expect(parsed.date_of_birth).toBe('15-03-1980');
    expect(parsed.sex).toBe('M');
    expect(parsed.tax_payer_number).toBe('RSSMRA80C15L419X');
    expect(parsed.city_of_birth_code).toBe('L419');
    expect(parsed.city_of_residence_code).toBe('L074');
  });

  it('skips zero-length fields and keeps the following ones', () => {
    const parsed = parsePersonalData(encodePersonalData(SYNTHETIC_FIELDS));

    expect(parsed.height).toBe('');
    expect(parsed.citizenship).toBe('');
    expect(parsed.street).toBe('');
    expect(parsed.notes).toBe('');
    expect(parsed.tax_payer_number).toBe('RSSMRA80C15L419X');
  });
});

describe('omitEmpty', () => {
  it('drops nullish, empty and whitespace-only values', () => {
    expect(
      omitEmpty({
        surname: 'ROSSI',
        height: '',
        street: '   ',
        notes: '',
      }),
    ).toEqual({ surname: 'ROSSI' });
  });
});

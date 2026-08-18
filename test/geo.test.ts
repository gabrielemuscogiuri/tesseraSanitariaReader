import { describe, expect, it } from 'vitest';
import {
  birthCodeFromCodiceFiscale,
  decodeIssuerRegion,
  enrichGeoFields,
  resolveCatastale,
} from '../src/geo.js';
import type { ParsedPersonalData } from '../src/types.js';

const emptyPersonal = (): ParsedPersonalData => ({
  issuer: '',
  issue_date: '',
  expiration_date: '',
  surname: '',
  given_name: '',
  date_of_birth: '',
  sex: '',
  height: '',
  tax_payer_number: '',
  citizenship: '',
  city_of_birth_code: '',
  foreign_birth_country: '',
  birth_certificate_ref: '',
  city_of_residence_code: '',
  street: '',
  notes: '',
});

describe('resolveCatastale', () => {
  it('resolves known cadastral codes', () => {
    expect(resolveCatastale('L419')).toMatchObject({
      code: 'L419',
      nome: 'Tricase',
      provincia: 'LE',
      regione: 'Puglia',
      label: 'Tricase (LE)',
    });
    expect(resolveCatastale('l074')).toMatchObject({
      code: 'L074',
      nome: 'Taviano',
      provincia: 'LE',
      label: 'Taviano (LE)',
    });
  });

  it('returns the code as label when unknown', () => {
    expect(resolveCatastale('ZZZZ')).toMatchObject({
      code: 'ZZZZ',
      label: 'ZZZZ',
      nome: '',
    });
  });
});

describe('decodeIssuerRegion', () => {
  it('maps issuer 6160 to Puglia', () => {
    expect(decodeIssuerRegion('6160')).toBe('Puglia');
  });
});

describe('enrichGeoFields', () => {
  it('fills birth/residence labels and issuer region', () => {
    const enriched = enrichGeoFields({
      ...emptyPersonal(),
      issuer: '6160',
      city_of_birth_code: 'L419',
      city_of_residence_code: 'L074',
    });

    expect(enriched.issuer_region).toBe('Puglia');
    expect(enriched.city_of_birth).toBe('Tricase (LE)');
    expect(enriched.city_of_residence).toBe('Taviano (LE)');
  });

  it('falls back to codice fiscale when birth code is empty', () => {
    const enriched = enrichGeoFields({
      ...emptyPersonal(),
      tax_payer_number: 'RSSMRA80C15L419X',
    });

    expect(birthCodeFromCodiceFiscale('RSSMRA80C15L419X')).toBe('L419');
    expect(enriched.city_of_birth).toBe('Tricase (LE)');
    expect(enriched.city_of_birth_code).toBe('L419');
  });
});

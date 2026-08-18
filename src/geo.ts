import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGION_CODES } from './constants.js';
import type { CatastaleMatch, Comune, ParsedPersonalData } from './types.js';

const COMUNI = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'data/comuniCatastali.json'), 'utf8'),
) as Record<string, Comune>;

const emptyCatastale = (code: string): CatastaleMatch => ({
  code,
  nome: '',
  provincia: '',
  regione: '',
  label: code,
});

export const resolveCatastale = (code: string | undefined): CatastaleMatch => {
  const normalized = (code ?? '').trim().toUpperCase();
  if (!normalized) {
    return emptyCatastale('');
  }
  const hit = COMUNI[normalized];
  if (!hit) {
    return emptyCatastale(normalized);
  }
  return {
    code: normalized,
    nome: hit.nome,
    provincia: hit.provincia,
    regione: hit.regione,
    label: `${hit.nome} (${hit.provincia})`,
  };
};

export const birthCodeFromCodiceFiscale = (taxPayerNumber: string | undefined): string => {
  const cf = (taxPayerNumber ?? '').trim().toUpperCase();
  return cf.length < 16 ? '' : cf.slice(11, 15);
};

export const decodeIssuerRegion = (issuer: string): string =>
  REGION_CODES[issuer] ?? REGION_CODES[issuer.slice(-3)] ?? REGION_CODES[issuer.slice(0, 3)] ?? '';

export const enrichGeoFields = (
  data: ParsedPersonalData,
): ParsedPersonalData & {
  issuer_region: string;
  city_of_birth: string;
  city_of_residence: string;
} => {
  const birth = resolveCatastale(
    data.city_of_birth_code || birthCodeFromCodiceFiscale(data.tax_payer_number),
  );
  const residence = resolveCatastale(data.city_of_residence_code);
  return {
    ...data,
    issuer_region: decodeIssuerRegion(data.issuer),
    city_of_birth: birth.label,
    city_of_birth_code: birth.code,
    city_of_residence: residence.label,
    city_of_residence_code: residence.code,
  };
};

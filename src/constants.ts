import type { PersonalDataField } from './types.js';

export const PERSONAL_DATA_FIELDS = [
  'issuer',
  'issue_date',
  'expiration_date',
  'surname',
  'given_name',
  'date_of_birth',
  'sex',
  'height',
  'tax_payer_number',
  'citizenship',
  'city_of_birth_code',
  'foreign_birth_country',
  'birth_certificate_ref',
  'city_of_residence_code',
  'street',
  'notes',
] as const satisfies readonly PersonalDataField[];

export const DATE_FIELDS = [
  'issue_date',
  'expiration_date',
  'date_of_birth',
] as const satisfies readonly PersonalDataField[];

export const REGION_CODES: Record<string, string> = {
  '010': 'Piemonte',
  '020': "Val D'Aosta",
  '030': 'Lombardia',
  '041': 'Provincia Autonoma di Bolzano',
  '042': 'Provincia Autonoma di Trento',
  '050': 'Veneto',
  '060': 'Friuli Venezia Giulia',
  '070': 'Liguria',
  '080': 'Emilia Romagna',
  '090': 'Toscana',
  '100': 'Umbria',
  '110': 'Marche',
  '120': 'Lazio',
  '130': 'Abruzzo',
  '140': 'Molise',
  '150': 'Campania',
  '160': 'Puglia',
  '170': 'Basilicata',
  '180': 'Calabria',
  '190': 'Sicilia',
  '200': 'Sardegna',
};

export const PERSONAL_DATA_HEADER_LENGTH = 6;
export const OK_RESPONSE_CODE = '9000';
export const CARD_ID_HEADER = '8038000';
export const CARD_ID_LENGTH = 13;
export const MAX_LE = 255;
export const TRANSMIT_MAX_RESPONSE = 512;

export const SELECT_APDU = Buffer.from([0x00, 0xa4, 0x08, 0x00]);
export const EF_DATI_PERSONALI = Buffer.from([0x11, 0x00, 0x11, 0x02]);
export const EF_ID_CARTA = Buffer.from([0x10, 0x00, 0x10, 0x03]);

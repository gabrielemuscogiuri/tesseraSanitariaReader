import {
  CARD_ID_HEADER,
  DATE_FIELDS,
  PERSONAL_DATA_FIELDS,
  PERSONAL_DATA_HEADER_LENGTH,
} from './constants.js';
import type { ParsedPersonalData, PersonalDataField } from './types.js';

type ParseState = {
  rest: string;
  values: ParsedPersonalData;
  stopped: boolean;
};

const emptyPersonalData = (): ParsedPersonalData =>
  PERSONAL_DATA_FIELDS.reduce(
    (values, field) => ({ ...values, [field]: '' }),
    {} as ParsedPersonalData,
  );

export const calculateLuhn = (controlString: string): number => {
  const { sum } = [...controlString].reverse().reduce(
    (acc, char) => {
      const digit = Number.parseInt(char, 10);
      const doubled = acc.shouldDouble ? digit * 2 : digit;
      const adjusted = doubled > 9 ? doubled - 9 : doubled;
      return {
        sum: acc.sum + (Number.isFinite(adjusted) ? adjusted : 0),
        shouldDouble: !acc.shouldDouble,
      };
    },
    { sum: 0, shouldDouble: false },
  );
  return (10 - (sum % 10)) % 10;
};

export const cleanData = (data: string): string =>
  data.replace(/\0+$/u, '').replace(/[^\x20-\x7E]/g, '');

export const calculateCardId = (rawData: Buffer): string => {
  const cardStem = CARD_ID_HEADER + rawData.subarray(1).toString('ascii');
  return cleanData(`${cardStem}${calculateLuhn(cardStem)}`);
};

const formatDate = (value: string): string =>
  value.length === 8 && /^\d{8}$/.test(value)
    ? `${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 8)}`
    : value;

const readField = (
  rest: string,
  field: PersonalDataField,
  values: ParsedPersonalData,
): ParseState => {
  if (rest.length < 2) {
    return { rest, values: { ...values, [field]: '' }, stopped: false };
  }
  const length = Number.parseInt(rest.slice(0, 2), 16);
  if (!Number.isFinite(length) || length < 0) {
    return { rest: '', values: { ...values, [field]: '' }, stopped: true };
  }
  return {
    rest: rest.slice(2 + length),
    values: { ...values, [field]: rest.slice(2, 2 + length) },
    stopped: false,
  };
};

const applyDates = (values: ParsedPersonalData): ParsedPersonalData =>
  DATE_FIELDS.reduce((next, field) => ({ ...next, [field]: formatDate(next[field]) }), values);

export const parsePersonalData = (buffer: Buffer): ParsedPersonalData => {
  const parsed = PERSONAL_DATA_FIELDS.reduce<ParseState>(
    (state, field) => (state.stopped ? state : readField(state.rest, field, state.values)),
    {
      rest: buffer.subarray(PERSONAL_DATA_HEADER_LENGTH).toString('latin1'),
      values: emptyPersonalData(),
      stopped: false,
    },
  );
  return applyDates(parsed.values);
};

export const omitEmpty = <T extends Record<string, string>>(data: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value != null && String(value).trim() !== ''),
  ) as Partial<T>;

import { connect, disconnect, fetchFile, readBinary, readBinaryFull, selectFile } from './apdu.js';
import {
  CARD_ID_LENGTH,
  EF_DATI_PERSONALI,
  EF_ID_CARTA,
  PERSONAL_DATA_HEADER_LENGTH,
} from './constants.js';
import { enrichGeoFields } from './geo.js';
import { calculateCardId, omitEmpty, parsePersonalData } from './parse.js';
import type { CardData, SmartCardReader } from './types.js';

export const readCardData = async (reader: SmartCardReader): Promise<CardData> => {
  const protocol = await connect(reader);
  try {
    await selectFile(reader, protocol, EF_DATI_PERSONALI);
    const header = await readBinary(reader, protocol, PERSONAL_DATA_HEADER_LENGTH);
    const payloadLength = Number.parseInt(header.toString('ascii'), 16);
    if (!Number.isFinite(payloadLength) || payloadLength <= 0) {
      throw new Error('Lunghezza dati personali non valida');
    }

    const personalData = await readBinaryFull(
      reader,
      protocol,
      PERSONAL_DATA_HEADER_LENGTH + payloadLength,
    );
    const parsed = enrichGeoFields(parsePersonalData(personalData));
    const cardIdData = await fetchFile(reader, protocol, EF_ID_CARTA, CARD_ID_LENGTH);

    return omitEmpty({ ...parsed, cardId: calculateCardId(cardIdData) });
  } finally {
    await disconnect(reader).catch(() => undefined);
  }
};

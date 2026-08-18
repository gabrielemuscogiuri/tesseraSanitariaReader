import { MAX_LE, OK_RESPONSE_CODE, SELECT_APDU, TRANSMIT_MAX_RESPONSE } from './constants.js';
import type { SmartCardReader } from './types.js';

const toError = (err: unknown, fallback: string): Error => {
  if (err instanceof Error) {
    return fallback ? new Error(`${fallback}: ${err.message}`) : err;
  }
  return new Error(fallback || String(err));
};

export const connect = (reader: SmartCardReader): Promise<number> =>
  new Promise((resolve, reject) => {
    reader.connect({ share_mode: reader.SCARD_SHARE_SHARED }, (err, protocol) => {
      if (err) {
        reject(toError(err, 'Errore di connessione'));
        return;
      }
      resolve(protocol);
    });
  });

export const transmit = (
  reader: SmartCardReader,
  data: Buffer,
  protocol: number,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    reader.transmit(data, TRANSMIT_MAX_RESPONSE, protocol, (err, response) => {
      if (err) {
        reject(toError(err, 'Trasmissione APDU fallita'));
        return;
      }
      resolve(response);
    });
  });

export const disconnect = (reader: SmartCardReader): Promise<void> =>
  new Promise((resolve, reject) => {
    reader.disconnect((err) => {
      if (err) {
        reject(toError(err, 'Disconnessione fallita'));
        return;
      }
      resolve();
    });
  });

const statusWord = (response: Buffer): string => response.subarray(-2).toString('hex');

const payloadOf = (response: Buffer): Buffer => response.subarray(0, -2);

export const selectFile = async (
  reader: SmartCardReader,
  protocol: number,
  file: Buffer,
): Promise<void> => {
  const selectApdu = Buffer.concat([SELECT_APDU, Buffer.from([file.length]), file]);
  const response = await transmit(reader, selectApdu, protocol);
  if (statusWord(response) !== OK_RESPONSE_CODE) {
    throw new Error('Selezione directory fallita');
  }
};

export const readBinary = async (
  reader: SmartCardReader,
  protocol: number,
  length: number,
  offset = 0,
): Promise<Buffer> => {
  const readApdu = Buffer.from([0x00, 0xb0, (offset >> 8) & 0xff, offset & 0xff, length & 0xff]);
  const response = await transmit(reader, readApdu, protocol);
  if (statusWord(response) !== OK_RESPONSE_CODE) {
    throw new Error('Lettura dati fallita');
  }
  return payloadOf(response);
};

export const readBinaryFull = async (
  reader: SmartCardReader,
  protocol: number,
  totalLength: number,
  offset = 0,
): Promise<Buffer> => {
  if (offset >= totalLength) {
    return Buffer.alloc(0);
  }
  const le = Math.min(MAX_LE, totalLength - offset);
  const chunk = await readBinary(reader, protocol, le, offset);
  const rest = await readBinaryFull(reader, protocol, totalLength, offset + le);
  return Buffer.concat([chunk, rest]);
};

export const fetchFile = async (
  reader: SmartCardReader,
  protocol: number,
  file: Buffer,
  length: number,
): Promise<Buffer> => {
  await selectFile(reader, protocol, file);
  return readBinary(reader, protocol, length);
};

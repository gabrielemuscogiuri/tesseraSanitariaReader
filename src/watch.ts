import pcsclite from 'pcsclite';
import { readCardData } from './session.js';
import type { SmartCardReader, WatchHandle, WatchOptions } from './types.js';

type WatchSession = {
  reading: boolean;
  present: boolean;
};

const asError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)));

const isReadable = (reader: SmartCardReader, status: { atr?: Buffer; state: number }): boolean => {
  const mute = Boolean(status.state & reader.SCARD_STATE_MUTE);
  return Boolean(
    status.state & reader.SCARD_STATE_PRESENT && !mute && (status.atr?.length ?? 0) > 0,
  );
};

const attachReader = (reader: SmartCardReader, options: WatchOptions): void => {
  const session: WatchSession = { reading: false, present: false };

  reader.on('status', (status) => {
    const readable = isReadable(reader, status);

    if (readable && !session.present && !session.reading) {
      session.present = true;
      session.reading = true;
      void readCardData(reader)
        .then((cardData) => options.onCard(cardData, { readerName: reader.name }))
        .catch((error: unknown) => options.onError?.(asError(error)))
        .finally(() => {
          session.reading = false;
        });
      return;
    }

    if (!readable && session.present) {
      session.present = false;
      options.onRemove?.({ readerName: reader.name });
      return;
    }

    session.present = readable;
  });

  reader.on('error', (error) => {
    options.onError?.(asError(error));
  });
};

export const watchTesseraSanitaria = (options: WatchOptions): WatchHandle => {
  const pcsc = pcsclite();

  pcsc.on('reader', (reader) => {
    options.onReader?.(reader.name);
    attachReader(reader as SmartCardReader, options);
  });

  pcsc.on('error', (error: unknown) => {
    options.onError?.(asError(error));
  });

  return {
    close: () => {
      pcsc.close();
    },
  };
};

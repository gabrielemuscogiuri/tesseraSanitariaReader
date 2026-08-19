import { contextBridge, ipcRenderer } from 'electron';
import type { CardData } from 'tessera-sanitaria-reader';

export type TesseraEvent =
  | { type: 'reader'; readerName: string }
  | { type: 'card'; data: CardData; readerName: string }
  | { type: 'remove'; readerName: string }
  | { type: 'error'; message: string };

export type TesseraAPI = {
  subscribe: (callback: (event: TesseraEvent) => void) => () => void;
};

type IpcListener = Parameters<typeof ipcRenderer.on>[1];

const makeListener =
  <T>(fn: (payload: T) => void): IpcListener =>
  (_e, payload) =>
    fn(payload as T);

contextBridge.exposeInMainWorld('tessera', {
  subscribe: (callback: (event: TesseraEvent) => void): (() => void) => {
    const listeners: Array<[string, IpcListener]> = [
      [
        'tessera:reader',
        makeListener<{ readerName: string }>((p) => callback({ type: 'reader', ...p })),
      ],
      [
        'tessera:card',
        makeListener<{ data: CardData; readerName: string }>((p) =>
          callback({ type: 'card', ...p }),
        ),
      ],
      [
        'tessera:remove',
        makeListener<{ readerName: string }>((p) => callback({ type: 'remove', ...p })),
      ],
      [
        'tessera:error',
        makeListener<{ message: string }>((p) => callback({ type: 'error', ...p })),
      ],
    ];

    for (const [channel, fn] of listeners) {
      ipcRenderer.on(channel, fn);
    }

    return () => {
      for (const [channel, fn] of listeners) {
        ipcRenderer.removeListener(channel, fn);
      }
    };
  },
} satisfies TesseraAPI);

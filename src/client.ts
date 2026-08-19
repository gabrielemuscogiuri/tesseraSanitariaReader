import type { CardData } from './types.js';

export type { CardData } from './types.js';

export type TesseraClientEvent =
  | { type: 'hello' }
  | { type: 'reader'; readerName: string }
  | { type: 'card'; data: CardData; readerName: string }
  | { type: 'remove'; readerName: string }
  | { type: 'error'; message: string };

export const DEFAULT_TESSERA_EVENTS_URL = 'http://127.0.0.1:3847/events';

export const subscribeTesseraSanitaria = (
  onEvent: (event: TesseraClientEvent) => void,
  url = DEFAULT_TESSERA_EVENTS_URL,
): { close: () => void } => {
  const source = new EventSource(url);
  source.onmessage = (message: MessageEvent<string>) => {
    onEvent(JSON.parse(message.data) as TesseraClientEvent);
  };
  source.onerror = () => {
    onEvent({
      type: 'error',
      message: 'Agente locale non raggiungibile. Avvia `npx tessera-sanitaria-agent`.',
    });
  };
  return { close: () => source.close() };
};

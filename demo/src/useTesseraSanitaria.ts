import { useEffect, useState } from 'react';
import { subscribeTesseraSanitaria, type CardData } from '../../src/client.ts';

export const useTesseraSanitaria = () => {
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Connessione al lettore locale…');

  useEffect(() => {
    const { close } = subscribeTesseraSanitaria((event) => {
      if (event.type === 'hello') {
        setStatus('In attesa della carta');
        return;
      }
      if (event.type === 'reader') {
        setError(null);
        setStatus(`Lettore: ${event.readerName}`);
        return;
      }
      if (event.type === 'card') {
        setError(null);
        setStatus('Carta letta');
        setCard(event.data);
        return;
      }
      if (event.type === 'remove') {
        setCard(null);
        setStatus('Carta rimossa. In attesa di una nuova carta…');
        return;
      }
      if (event.type === 'error') {
        setError(event.message);
      }
    }, '/events');
    return close;
  }, []);

  return { card, error, status };
};

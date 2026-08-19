import { useEffect, useState } from 'react';
import type { CardData } from 'tessera-sanitaria-reader/client';
import type { TesseraEvent } from './preload';

declare global {
  interface Window {
    tessera: {
      subscribe: (callback: (event: TesseraEvent) => void) => () => void;
    };
  }
}

const LABELS: Record<string, string> = {
  tax_payer_number: 'Codice fiscale',
  cardId: 'Numero tessera',
  sex: 'Sesso',
  date_of_birth: 'Data di nascita',
  city_of_birth: 'Comune di nascita',
  city_of_birth_code: 'Codice nascita',
  city_of_residence: 'Comune di residenza',
  city_of_residence_code: 'Codice residenza',
  street: 'Indirizzo',
  issuer: 'Ente emittente',
  issuer_region: 'Regione',
  issue_date: 'Data emissione',
  expiration_date: 'Scadenza',
  citizenship: 'Cittadinanza',
  foreign_birth_country: 'Nascita estera',
  birth_certificate_ref: 'Atto di nascita',
  height: 'Altezza',
  notes: 'Note',
};

const FIELD_ORDER = Object.keys(LABELS);

const statusKind = (error: string | null, card: CardData | null, status: string): string => {
  if (error) return 'err';
  if (card || status.startsWith('Lettore') || status === 'Carta letta') return 'ok';
  return 'wait';
};

export const App = () => {
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('In attesa del lettore…');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    return window.tessera.subscribe((event) => {
      if (event.type === 'reader') {
        setError(null);
        setStatus(`Lettore: ${event.readerName}`);
      } else if (event.type === 'card') {
        setError(null);
        setStatus('Carta letta');
        setCard(event.data);
      } else if (event.type === 'remove') {
        setCard(null);
        setStatus('Carta rimossa. In attesa di una nuova carta…');
      } else if (event.type === 'error') {
        setError(event.message);
      }
    });
  }, []);

  const copyFieldValue = async (key: string) => {
    if (!card) return;
    const value = card[key as keyof CardData];
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      setError('Impossibile copiare negli appunti');
    }
  };

  const name = [card?.surname, card?.given_name].filter(Boolean).join(' ');
  const rows = FIELD_ORDER.filter((key) => card?.[key as keyof CardData]);

  const statusClass = statusKind(error, card, status);

  return (
    <main>
      <div className="header">
        <div className="titleWrap">
          <h1>Lettore tessera sanitaria</h1>
          <p className="lede">App locale. Collega il lettore USB, poi inserisci la carta.</p>
        </div>

        <div className={`status ${statusClass}`}>
          <span className="dot" />
          <span>{error ?? status}</span>
        </div>
      </div>

      <section className="panel">
        {!card ? (
          <p className="empty">In attesa della carta.</p>
        ) : (
          <>
            {name ? <p className="name">{name}</p> : null}
            <div className="fields">
              {rows.map((key) => (
                <div key={key} className="field">
                  <div className="label">{LABELS[key] ?? key}</div>
                  <div className="valueRow">
                    <div className="value">{card[key as keyof CardData]}</div>
                    <button type="button" className="copy" onClick={() => void copyFieldValue(key)}>
                      {copiedKey === key ? 'Copiato' : 'Copia'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

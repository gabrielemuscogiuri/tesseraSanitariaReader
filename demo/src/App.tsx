import type { CardData } from '../../src/client.ts';
import { useTesseraSanitaria } from './useTesseraSanitaria.ts';

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
  const { card, error, status } = useTesseraSanitaria();
  const name = [card?.surname, card?.given_name].filter(Boolean).join(' ');
  const rows = FIELD_ORDER.filter((key) => card?.[key as keyof CardData]);

  return (
    <main>
      <h1>Lettore tessera sanitaria</h1>
      <p className="lede">
        Demo locale. Collega il lettore USB, poi inserisci la carta. I dati restano su questo
        computer.
      </p>
      <div className={`status ${statusKind(error, card, status)}`}>
        <span className="dot" />
        <span>{error ?? status}</span>
      </div>
      <section className="panel">
        {!card ? (
          <p className="empty">In attesa della carta.</p>
        ) : (
          <>
            {name ? <p className="name">{name}</p> : null}
            <dl>
              {rows.map((key) => (
                <span key={key} className="row">
                  <dt>{LABELS[key] ?? key}</dt>
                  <dd>{card[key as keyof CardData]}</dd>
                </span>
              ))}
            </dl>
          </>
        )}
      </section>
    </main>
  );
};

const pcsclite = require("pcsclite");
const pcsc = pcsclite();
const luhn = require("luhn");

const FIELDS = [
  "issuer",
  "issue_data",
  "expiration_date",
  "surname",
  "given_name",
  "date_of_birth",
  "sex",
  "height",
  "tax_payer_number",
  "city_of_issue",
  "city_of_residence",
  "street",
  "birth_city", // Aggiunto campo per città di nascita
];

const OK_RESPONSE_CODE = "9000";
const CARD_ID_HEADER = "8038000";
const EF_DATI_PERSONALI_LENGTH = 12;
const CARD_ID_LENGTH = 14;

const SELECT_APDU = Buffer.from([0x00, 0xa4, 0x08, 0x00]);
const READ_BINARY_APDU = Buffer.from([0x00, 0xb0, 0x00, 0x00]);
const EF_DATI_PERSONALI = Buffer.from([0x11, 0x00, 0x11, 0x02]);
const EF_ID_CARTA = Buffer.from([0x10, 0x00, 0x10, 0x03]);

// Mappa per codici Regione
const regionCodes = {
  "010": "Piemonte",
  "020": "Val D'Aosta",
  "030": "Lombardia",
  "041": "Provincia Autonoma di Bolzano",
  "042": "Provincia Autonoma di Trento",
  "050": "Veneto",
  "060": "Friuli Venezia Giulia",
  "070": "Liguria",
  "080": "Emilia Romagna",
  "090": "Toscana",
  100: "Umbria",
  110: "Marche",
  120: "Lazio",
  130: "Abruzzo",
  140: "Molise",
  150: "Campania",
  160: "Puglia",
  170: "Basilicata",
  180: "Calabria",
  190: "Sicilia",
  200: "Sardegna",
};

// Gestione lettore
pcsc.on("reader", (reader) => {
  console.log("Lettore rilevato:", reader.name);

  reader.on("status", (status) => {
    const changes = reader.state ^ status.state;

    if (
      changes & reader.SCARD_STATE_PRESENT &&
      status.state & reader.SCARD_STATE_PRESENT
    ) {
      reader.connect(
        { share_mode: reader.SCARD_SHARE_SHARED },
        async (err, protocol) => {
          if (err) {
            console.error("Errore di connessione:", err.message);
            return;
          }

          try {
            await navigateToDirectory(reader, protocol, EF_DATI_PERSONALI);
            const personalData = await readData(
              reader,
              protocol,
              EF_DATI_PERSONALI_LENGTH
            );
            const datiEstratti = estraiDatiCompleti(
              personalData.toString("utf8")
            );
            console.log("Dati Estratti:", datiEstratti);

            await navigateToDirectory(reader, protocol, EF_ID_CARTA);
            const cardIdData = await readData(reader, protocol, CARD_ID_LENGTH);
            console.log("ID Carta:", calculateCardId(cardIdData));
          } catch (error) {
            console.error("Errore:", error.message);
          } finally {
            reader.disconnect(() => console.log("Carta disconnessa"));
          }
        }
      );
    }
  });
});

// Navigazione directory
function navigateToDirectory(reader, protocol, directory) {
  return new Promise((resolve, reject) => {
    const selectApdu = Buffer.concat([
      SELECT_APDU,
      Buffer.from([directory.length.toString(16).padStart(2, "0")], "hex"),
      directory,
    ]);
    reader.transmit(selectApdu, 512, protocol, (err, response) => {
      if (err) return reject(err);
      if (response.toString("hex").slice(-4) === OK_RESPONSE_CODE) resolve();
      else reject(new Error("Selezione directory fallita"));
    });
  });
}

// Lettura dati
function readData(reader, protocol, length) {
  return new Promise((resolve, reject) => {
    const readApdu = Buffer.concat([
      READ_BINARY_APDU,
      Buffer.from([length.toString(16).padStart(2, "0")], "hex"),
    ]);
    reader.transmit(readApdu, 512, protocol, (err, data) => {
      if (err) return reject(err);
      if (data.toString("hex").slice(-4) === OK_RESPONSE_CODE)
        resolve(data.slice(0, -2));
      else reject(new Error("Lettura dati fallita"));
    });
  });
}

// Funzione per estrarre dati
function estraiDatiCompleti(data) {
  const risultato = {};

  risultato.original = cleanData(data);

  // Rimuovi i primi 24 caratteri (costanti)
  data = data.slice(9);

  // Estrarre e assegnare il codice Regione
  const codiceRegione = data.slice(0, 3);
  risultato.regioneASL = regionCodes[codiceRegione] || "Regione sconosciuta";
  data = data.slice(15);

  // Estrarre e formattare la data di scadenza
  const dataScadenza = data.slice(0, 8);
  risultato.dataDiScadenza = `${dataScadenza.slice(0, 2)}-${dataScadenza.slice(
    2,
    4
  )}-${dataScadenza.slice(4)}`;
  data = data.slice(8);

  // Rimuovi 2 caratteri (0X)
  data = data.slice(2);

  // Rimuovi altri dati anagrafici e di validità
  const cognomeMatch = data.match(/^[A-Z]+/);
  if (cognomeMatch) {
    risultato.cognome = cognomeMatch[0].trim();
    data = data.slice(risultato.cognome.length);
  }

  data = data.slice(2);

  const nomeMatch = data.match(/^[A-Z ]+/);
  if (nomeMatch) {
    risultato.nome = nomeMatch[0].trim();
    data = data.slice(risultato.nome.length);
  }

  data = data.slice(2);

  const dataNascita = data.slice(0, 8);
  risultato.dataDiNascita = `${dataNascita.slice(0, 2)}-${dataNascita.slice(
    2,
    4
  )}-${dataNascita.slice(4)}`;
  data = data.slice(8);

  data = data.slice(2);

  risultato.sesso = data.slice(0, 1);
  data = data.slice(1);

  data = data.slice(4);

  risultato.codiceFiscale = data.slice(0, 16);
  data = data.slice(16);

  data = data.slice(4);

  risultato.codiceComune = data.slice(0, 4);
  data = data.slice(10);

  risultato.checkDigit = data.slice(0, 1);

  return risultato;
}

// Calcolo Luhn
function calculateLuhn(controlString) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = controlString.length - 1; i >= 0; i--) {
    let digit = parseInt(controlString[i], 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (10 - (sum % 10)) % 10;
}

// Pulizia dati
function cleanData(data) {
  return data.replace(/\x00+$/, "").replace(/[^\x20-\x7E]/g, "");
}

// Calcolo ID carta
function calculateCardId(rawData) {
  const cardStem = CARD_ID_HEADER + rawData.slice(1, -2).toString("hex");
  const controlDigit = calculateLuhn(cardStem);
  return cleanData(cardStem + controlDigit);
}

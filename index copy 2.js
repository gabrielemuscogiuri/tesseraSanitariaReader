const pcsclite = require("pcsclite");
const pcsc = pcsclite();

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
];
const EF_DATI_PERSONALI_LENGTH = 12;
const OK_RESPONSE_CODE = "9000";
const CARD_ID_HEADER = "8038000";
const TIMEOUT = 500;
const CARD_ID_LENGTH = 14;

const SELECT_APDU = Buffer.from([0x00, 0xa4, 0x08, 0x00]);
const READ_BINARY_APDU = Buffer.from([0x00, 0xb0, 0x00, 0x00]);
const EF_DATI_PERSONALI = Buffer.from([0x11, 0x00, 0x11, 0x02]);
const EF_ID_CARTA = Buffer.from([0x10, 0x00, 0x10, 0x03]);

pcsc.on("reader", (reader) => {
  console.log("Lettore rilevato:", reader.name);

  reader.on("status", (status) => {
    const changes = reader.state ^ status.state;

    if (changes & reader.SCARD_STATE_PRESENT) {
      if (status.state & reader.SCARD_STATE_PRESENT) {
        reader.connect(
          { share_mode: reader.SCARD_SHARE_SHARED },
          async (err, protocol) => {
            if (err) {
              console.error("Errore di connessione:", err.message);
              return;
            }
            console.log("Connesso alla carta, protocollo:", protocol);

            try {
              await navigateToDirectory(reader, protocol, EF_DATI_PERSONALI);
              const personalData = await readData(
                reader,
                protocol,
                EF_DATI_PERSONALI_LENGTH
              );
              console.log("Dati Personali:", parseData(personalData));

              await navigateToDirectory(reader, protocol, EF_ID_CARTA);
              const cardIdData = await readData(
                reader,
                protocol,
                CARD_ID_LENGTH
              );
              console.log("ID Carta:", calculateCardId(cardIdData));
            } catch (error) {
              console.error("Errore:", error.message);
            } finally {
              reader.disconnect(() => console.log("Carta disconnessa"));
            }
          }
        );
      }
    }
  });
});

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

function parseIssuerData(issuerData) {
  return {
    codiceFiscale: issuerData.slice(0, 16), // 16 caratteri per il Codice Fiscale
    cognome: issuerData.slice(16, 36).trim(), // 20 caratteri per il Cognome
    nome: issuerData.slice(36, 56).trim(), // 20 caratteri per il Nome
    dataDiNascita: issuerData.slice(56, 64), // 8 caratteri per la Data di Nascita (YYYYMMDD)
    sesso: issuerData.slice(64, 65), // 1 carattere per il Sesso
    luogoDiNascita: issuerData.slice(65, 75).trim(), // 10 caratteri per il Luogo di Nascita
    codiceIdentificativo: issuerData.slice(75).trim(), // Resto della stringa come codice identificativo
  };
}

function parseData(data) {
  const result = {};
  let index = 0;
  let offset = 0;

  while (offset < data.length && index < FIELDS.length) {
    const length = parseInt(data.slice(offset, offset + 2).toString("hex"), 16);
    const fieldData = data.slice(offset + 2, offset + 2 + length);
    result[FIELDS[index]] = cleanData(fieldData.toString("utf8"));
    offset += 2 + length;
    index += 1;
  }

  // Se il campo 'issuer' è presente, estrai i singoli dati con parseIssuerData
  if (result.issuer) {
    result.issuer = parseIssuerData(result.issuer);
  }

  return result;
}

function calculateLuhn(controlString) {
  let sum = 0;
  let shouldDouble = false;

  // Itera i caratteri da destra a sinistra
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

  return (10 - (sum % 10)) % 10; // Calcola il controllo Luhn
}

function cleanData(data) {
  // Rimuovi i caratteri \x00 e taglia alla prima occorrenza di caratteri non ASCII
  return data.replace(/\x00+$/, "").replace(/[^\x20-\x7E]/g, "");
}

function calculateCardId(rawData) {
  const cardStem = CARD_ID_HEADER + rawData.slice(1, -2).toString("hex");
  const controlDigit = calculateLuhn(cardStem);
  return cleanData(cardStem + controlDigit);
}

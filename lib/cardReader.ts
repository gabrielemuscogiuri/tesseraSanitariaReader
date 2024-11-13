import pcsclite from 'pcsclite';
import { calculateLuhn, cleanData } from './utils';

// Field definitions and constants
const FIELDS = [
    "issuer", "issue_data", "expiration_date", "surname", "given_name", "date_of_birth",
    "sex", "height", "tax_payer_number", "city_of_issue", "city_of_residence", "street",
];

const EF_DATI_PERSONALI_LENGTH = 12;
const OK_RESPONSE_CODE = "9000";
const CARD_ID_HEADER = "8038000";
const CARD_ID_LENGTH = 14;

const SELECT_APDU = Buffer.from([0x00, 0xa4, 0x08, 0x00]);
const READ_BINARY_APDU = Buffer.from([0x00, 0xb0, 0x00, 0x00]);
const EF_DATI_PERSONALI = Buffer.from([0x11, 0x00, 0x11, 0x02]);
const EF_ID_CARTA = Buffer.from([0x10, 0x00, 0x10, 0x03]);

/**
 * Initializes the card reader and resolves with the reader instance on detection.
 */
export function initializeCardReader() {
    return new Promise((resolve, reject) => {
        const pcsc = pcsclite();
        pcsc.on('reader', (reader) => {
            console.log("Lettore rilevato:", reader.name);
            reader.on('status', (status) => {
                const changes = reader.state ^ status.state;
                if (changes & reader.SCARD_STATE_PRESENT && status.state & reader.SCARD_STATE_PRESENT) {
                    resolve(reader);
                }
            });
        });
        pcsc.on('error', reject);
    });
}

/**
 * Reads card data by connecting to the reader and navigating to necessary directories.
 */
export async function readCardData(reader) {
    return new Promise((resolve, reject) => {
        reader.connect({ share_mode: reader.SCARD_SHARE_SHARED }, async (err, protocol) => {
            if (err) return reject(new Error("Errore di connessione: " + err.message));

            console.log("Connesso alla carta, protocollo:", protocol);
            try {
                const personalData = await fetchData(reader, protocol, EF_DATI_PERSONALI, EF_DATI_PERSONALI_LENGTH) as unknown as Buffer;
                const datiEstratti = extractCompleteData(personalData.toString("utf8"));

                const cardIdData = await fetchData(reader, protocol, EF_ID_CARTA, CARD_ID_LENGTH) as unknown as Buffer;
                const cardId = calculateCardId(cardIdData);

                resolve({ ...datiEstratti, cardId });
            } catch (error) {
                reject(error);
            } finally {
                reader.disconnect(() => console.log("Carta disconnessa"));
            }
        });
    });
}

/**
 * Helper to navigate to a specific directory and ensure selection.
 */
function navigateToDirectory(reader, protocol, directory) {
    return new Promise((resolve, reject) => {
        const selectApdu = Buffer.concat([
            SELECT_APDU,
            Buffer.from([directory.length.toString(16).padStart(2, "0")].join(""), "hex"),
            directory,
        ]);
        reader.transmit(selectApdu, 512, protocol, (err, response) => {
            if (err) return reject(err);
            response.toString("hex").slice(-4) === OK_RESPONSE_CODE ? resolve(void 0) : reject(new Error("Selezione directory fallita"));
        });
    });
}

/**
 * Helper to read binary data from the card.
 */
function readData(reader, protocol, length) {
    return new Promise((resolve, reject) => {
        const readApdu = Buffer.concat([
            READ_BINARY_APDU,
            Buffer.from(length.toString(16).padStart(2, "0"), "hex"),
        ]);
        reader.transmit(readApdu, 512, protocol, (err, data) => {
            if (err) return reject(err);
            data.toString("hex").slice(-4) === OK_RESPONSE_CODE
                ? resolve(data.slice(0, -2))
                : reject(new Error("Lettura dati fallita"));
        });
    });
}

/**
 * Wrapper function to navigate to a directory and read data.
 */
async function fetchData(reader, protocol, directory, length) {
    await navigateToDirectory(reader, protocol, directory);
    return await readData(reader, protocol, length);
}

/**
 * Calculates card ID using Luhn algorithm and cleans the result.
 */
function calculateCardId(rawData) {
    const cardStem = CARD_ID_HEADER + rawData.slice(1, -2).toString("hex");
    const controlDigit = calculateLuhn(cardStem);
    return cleanData(cardStem + controlDigit);
}

/**
 * Extracts complete data from the provided data string.
 */
function extractCompleteData(data) {
    interface ExtractedData {
        original: string;
        expiration_date: string;
        surname?: string;
        given_name?: string;
        date_of_birth: string;
        sex: string;
        tax_payer_number: string;
        city_of_issue: string;
        check_digit: string;
    }

    const extractField = (pattern: RegExp, data: string): [string, string] => {
        const match = data.match(pattern);
        if (match) {
            return [match[0].trim(), data.slice(match[0].length + 2)];
        }
        return ["", data];
    };

    const result: ExtractedData = {
        original: cleanData(data),
        expiration_date: `${data.slice(24, 26)}-${data.slice(26, 28)}-${data.slice(28, 32)}`,
        date_of_birth: `${data.slice(42, 44)}-${data.slice(44, 46)}-${data.slice(46, 50)}`,
        sex: data.slice(50, 51),
        tax_payer_number: data.slice(56, 72),
        city_of_issue: data.slice(72, 76),
        check_digit: data.slice(76, 77)
    };

    data = data.slice(32);
    [result.surname, data] = extractField(/^[A-Z]+/, data);
    [result.given_name, data] = extractField(/^[A-Z ]+/, data);

    return result;
}

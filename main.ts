import { initializeCardReader, readCardData } from './lib/cardReader.js';

async function main() {
    try {
        console.log("Inizializzazione del lettore di carte...");
        const reader: any = await initializeCardReader();
        console.log("Lettore inizializzato. In attesa di una carta...");

        (reader).on('status', async (status) => {
            const changes = reader.state ^ status.state;
            if (changes & reader.SCARD_STATE_PRESENT && status.state & reader.SCARD_STATE_PRESENT) {
                console.log("Carta rilevata. Lettura in corso...");
                try {
                    const cardData = await readCardData(reader);
                    console.log("Dati della carta letti con successo:");
                    console.log(JSON.stringify(cardData, null, 2));
                } catch (error) {
                    console.error("Errore durante la lettura della carta:", error.message);
                }
            } else if (changes & reader.SCARD_STATE_EMPTY && status.state & reader.SCARD_STATE_EMPTY) {
                console.log("Carta rimossa. In attesa di una nuova carta...");
            }
        });

        reader.on('error', (err) => {
            console.error("Errore del lettore:", err.message);
        });

    } catch (error) {
        console.error("Errore durante l'inizializzazione del lettore:", error.message);
    }
}

main();
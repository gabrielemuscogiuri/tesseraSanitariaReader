const pcsclite = require("pcsclite");
const pcsc = pcsclite();

pcsc.on("reader", (reader) => {
  console.log("Lettore rilevato:", reader.name);

  reader.on("error", (err) => {
    console.log("Errore del lettore:", err.message);
  });

  reader.on("status", (status) => {
    const changes = reader.state ^ status.state;

    if (changes & reader.SCARD_STATE_PRESENT) {
      if (status.state & reader.SCARD_STATE_PRESENT) {
        console.log("Carta inserita, connessione in corso...");
        reader.connect(
          { share_mode: reader.SCARD_SHARE_SHARED },
          (err, protocol) => {
            if (err) {
              console.error("Errore di connessione:", err.message);
              return;
            }
            console.log("Carta connessa, protocollo:", protocol);

            // Esempio di comando APDU per selezionare l'applicazione
            const selectApdu = Buffer.from([0x00, 0xa4, 0x04, 0x00]);
            reader.transmit(selectApdu, 255, protocol, (err, data) => {
              if (err) {
                console.error("Errore trasmissione:", err);
                return;
              }
              console.log("Risposta APDU:", data.toString("hex"));

              // Esegui altri comandi APDU per leggere i dati dalla carta
              // Ad esempio, per leggere il Codice Fiscale o i dati personali
            });
          }
        );
      } else {
        console.log("Carta rimossa");
        reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
          if (err) {
            console.error("Errore disconnessione:", err.message);
          } else {
            console.log("Carta disconnessa");
          }
        });
      }
    }
  });

  reader.on("end", () => {
    console.log("Lettore rimosso:", reader.name);
  });
});

pcsc.on("error", (err) => {
  console.log("Errore PCSC:", err.message);
});

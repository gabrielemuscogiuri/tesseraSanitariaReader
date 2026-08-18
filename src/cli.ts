import { watchTesseraSanitaria } from './index.js';

console.log('Inizializzazione del lettore di carte...');

watchTesseraSanitaria({
  onReader: (readerName) => {
    console.log('Lettore rilevato:', readerName);
    console.log('In attesa di una carta...');
  },
  onCard: (cardData) => {
    console.log('Dati della carta letti con successo:');
    console.log(JSON.stringify(cardData, null, 2));
  },
  onRemove: () => {
    console.log('Carta rimossa. In attesa di una nuova carta...');
  },
  onError: (error) => {
    console.error('Errore:', error.message);
  },
});

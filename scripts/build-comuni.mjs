import fs from 'node:fs';

const source = '/tmp/comuni-it.json';
const comuni = JSON.parse(fs.readFileSync(source, 'utf8'));

const map = comuni.reduce((acc, comune) => {
  if (!comune.codiceCatastale) {
    return acc;
  }
  return {
    ...acc,
    [String(comune.codiceCatastale).toUpperCase()]: {
      nome: comune.nome,
      provincia: comune.sigla,
      regione: comune.regione?.nome ?? '',
    },
  };
}, {});

fs.writeFileSync(new URL('../src/data/comuniCatastali.json', import.meta.url), JSON.stringify(map));
console.log('comuni', Object.keys(map).length);

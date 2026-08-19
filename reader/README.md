# tessera-sanitaria-electron

![Icona dell'app](./assets/icon.png)

## Download

Versione macOS (Apple Silicon / arm64):

- [Scarica Lettore Tessera Sanitaria (DMG)](https://drive.google.com/file/d/1NlQWFSUuNXAzLojcHnLVkArBUSe2Abw1/view?usp=sharing)

### Lettori consigliati

- **BIT4ID miniLector EVO v3** (PC/SC)

App desktop che legge la tessera sanitaria con un doppio click — niente terminale, niente Node installato dall'utente.

`pcsclite` gira esclusivamente nel **main process**. Il renderer (React) riceve i dati via IPC attraverso `contextBridge` — niente SSE, niente porte aperte.

L'app si minimizza nel **tray** (area di notifica) invece di chiudersi, così rimane sempre in ascolto. Quando viene inserita una carta la finestra torna in primo piano automaticamente.

## Struttura

```
src/
  main.ts        Electron main — watchTesseraSanitaria + IPC push + tray
  preload.ts     contextBridge → window.tessera.subscribe(callback)
  App.tsx        React UI — mostra i campi con bottone "Copia" per ognuno
  main.tsx       React entry point
assets/
  icon.png       Icona placeholder 256×256 (sostituire prima di distribuire)
  icon.ico       Per Windows (da generare, vedi assets/README.md)
  icon.icns      Per macOS  (da generare, vedi assets/README.md)
index.html
vite.config.ts   Build renderer (Vite)
tsconfig.json    Compilazione main + preload (tsc, CommonJS → dist-main/)
```

## Prerequisiti (solo per sviluppo/packaging, non per l'utente finale)

- Node.js 18+
- Un lettore smart card PC/SC
  - macOS: built-in (CryptoTokenKit)
  - Linux: `pcscd` + `libpcsclite`
  - Windows: WinSCard (built-in)
- La libreria buildata: `pnpm build` dalla root del repo

## Avvio rapido (sviluppo)

```bash
# 1. Dalla root del repo — builda la libreria
pnpm build

# 2. Entra nell'esempio e installa le dipendenze
cd reader
npm install

# 3. Compila main + preload e avvia Electron
npm run build:main
npm start
```

Per live reload durante lo sviluppo:

```bash
npm run dev
```

## Packaging — generare il programma installabile

```bash
# Tutto (Windows .exe + macOS .dmg)
npm run dist

# Solo Windows (.exe installer NSIS)
npm run dist:win

# Solo macOS (.dmg)
npm run dist:mac
```

Gli artefatti vengono scritti nella cartella `release/`.

> **Prima di distribuire** sostituisci le icone placeholder in `assets/`.
> Vedi `assets/README.md` per come generare `.ico` (Windows) e `.icns` (macOS) da un PNG.

## Come funziona

```
Lettore USB → PC/SC del SO → main.ts (watchTesseraSanitaria)
                                  ↓  webContents.send (IPC)
                             preload.ts (contextBridge)
                                  ↓  window.tessera.subscribe
                             App.tsx (React state + bottoni "Copia")
```

Il renderer non importa mai `tessera-sanitaria-reader` direttamente. Vede solo `window.tessera.subscribe`, una funzione esposta via `contextBridge`.

## Comportamento tray

- Cliccare **X** nasconde la finestra nel tray, l'app rimane in ascolto.
- **Doppio click** sull'icona tray mostra di nuovo la finestra.
- **Menu tray → Esci** termina l'app.
- Quando viene inserita una tessera, la finestra torna in primo piano automaticamente.

## Icona tray su macOS (nota)

Su macOS l'icona nel menu bar deve essere monocromatica per integrarsi con il tema del sistema. Se l'icona compare colorata, usa una variante in bianco/nero o imposta `tray.setImage` con un template image (nome che termina in `Template.png`).

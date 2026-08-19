# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-19

### Added

- `createTesseraSseServer(opts?)` — public API to embed the loopback SSE bridge in any Node process
- `tessera-sanitaria-agent` binary — zero-config SSE agent for local web app integration (`npx tessera-sanitaria-agent`)
- `GET /health` endpoint on the SSE agent returning `{ "ok": true }`
- `TESSERA_CORS_ORIGIN` environment variable to lock the CORS origin in production
- Electron desktop app in `reader/` (main + preload IPC + React renderer, tray, packaging — not in npm tarball)
- Service templates in `examples/service/` for running the agent as a persistent background service (macOS launchd, Linux systemd)

### Changed

- `demo/server.ts` refactored as a thin wrapper around `createTesseraSseServer`
- Error message in `tessera-sanitaria-reader/client` updated to reference the agent binary

## [1.1.1] - 2026-08-19

### Added

- Electron desktop app: UI più chiara e moderna, bottoni “Copia” per campo
- Tray icon: apertura “popup” ancorata all’icona in alto e nascondimento Dock icon su macOS
- Packaging desktop: inclusione dei file di asset e fix per runtime (`pcsclite`, `comuniCatastali.json`)

### Changed

- Rimosso il vecchio `demo/` dal repo e aggiornate le reference in script/README (rimane l’agente locale `tessera-sanitaria-agent`)

## [1.0.0] - 2026-08-18

### Added

- TypeScript library to read Italian tessera sanitaria (TS-CNS) anagraphic data via PC/SC
- CLI (`npx tessera-sanitaria-reader`)
- Browser client subpath (`tessera-sanitaria-reader/client`) for React and other front ends
- Local Vite + React demo with a loopback SSE agent (`pnpm demo`)
- Cadastral municipality lookup and issuer region decoding
- Hardware-free unit tests (TLV parse, Luhn card id, geo)
- GitHub Release workflow that publishes the npm tarball

### Changed

- Replaced the JavaScript prototype with a strict TypeScript package
- Municipality data is shipped once as `dist/data/comuniCatastali.json`

### Removed

- Legacy `index.js` copies and in-bundle HTML UI

[1.1.0]: https://github.com/gabrielemuscogiuri/tesseraSanitariaReader/releases/tag/v1.1.0
[1.1.1]: https://github.com/gabrielemuscogiuri/tesseraSanitariaReader/releases/tag/v1.1.1
[1.0.0]: https://github.com/gabrielemuscogiuri/tesseraSanitariaReader/releases/tag/v1.0.0

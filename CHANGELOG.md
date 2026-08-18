# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/gabrielemuscogiuri/tesseraSanitariaReader/releases/tag/v1.0.0

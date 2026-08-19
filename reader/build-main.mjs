// Bundles the Electron main process and preload script with esbuild.
// tessera-sanitaria-reader is inlined; only electron and pcsclite stay external.
import { copyFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Resolve the CJS entry of the local tessera-sanitaria-reader package.
// Using the CJS build avoids ESM/CJS interop issues inside the Electron bundle.
const tesseraEntry = resolve(__dirname, '../dist/index.cjs');

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  // electron is provided by the runtime; pcsclite is a native addon resolved from node_modules
  external: ['electron', 'pcsclite'],
  alias: {
    'tessera-sanitaria-reader': tesseraEntry,
  },
  sourcemap: false,
  minify: false,
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ['src/main.ts'],
    outfile: 'dist-main/main.js',
  }),
  build({
    ...shared,
    entryPoints: ['src/preload.ts'],
    outfile: 'dist-main/preload.js',
  }),
]);

// Runtime asset required by tessera-sanitaria-reader (geo/codici catastali).
// The library loads it relative to dist-main/, so we copy it next to the bundled output.
const dataSrc = resolve(__dirname, '../dist/data/comuniCatastali.json');
const dataDest = resolve(__dirname, 'dist-main/data/comuniCatastali.json');

await mkdir(resolve(__dirname, 'dist-main/data'), { recursive: true });
await copyFile(dataSrc, dataDest);

console.log('main process bundled → dist-main/');

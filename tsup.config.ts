import { build as esbuild } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
  },
  format: ['esm', 'cjs'],
  dts: { entry: { index: 'src/index.ts', client: 'src/client.ts' } },
  minify: true,
  sourcemap: false,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['pcsclite'],
  target: 'node18',
  async onSuccess() {
    await mkdir('dist/data', { recursive: true });
    await copyFile('src/data/comuniCatastali.json', 'dist/data/comuniCatastali.json');
    await esbuild({
      entryPoints: ['src/cli.ts'],
      outfile: 'dist/cli.js',
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      minify: true,
      banner: { js: '#!/usr/bin/env node' },
      plugins: [
        {
          name: 'external-index',
          setup(build) {
            build.onResolve({ filter: /^\.\/index\.js$/ }, () => ({
              path: './index.js',
              external: true,
            }));
          },
        },
      ],
      external: ['pcsclite'],
    });
  },
});

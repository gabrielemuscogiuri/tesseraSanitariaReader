import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Renderer-only Vite config. The main and preload processes are compiled
// separately with tsc (tsconfig.json in this folder).
export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
  },
  base: './',
});

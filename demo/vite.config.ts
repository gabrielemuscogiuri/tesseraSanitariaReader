import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const demoRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: demoRoot,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/events': {
        target: 'http://127.0.0.1:3847',
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
});

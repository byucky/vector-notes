import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  base: './',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist/vector-notes/browser'),
    emptyOutDir: true,
  },
});


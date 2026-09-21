import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Pre-transform the app on startup so the first page load doesn't wait on disk reads.
    warmup: {
      clientFiles: ['./src/main.jsx'],
    },
  },
});


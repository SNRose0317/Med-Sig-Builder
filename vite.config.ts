import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { apiPlugin } from './src/api/server';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0' // Force IPv4 binding to work around Node v23 issues
  },
  optimizeDeps: {
    include: ['uuid']
  }
});

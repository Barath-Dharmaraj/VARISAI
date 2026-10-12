import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8060,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8050',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:8050',
        ws: true
      }
    }
  }
});

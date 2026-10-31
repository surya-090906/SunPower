import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: { alias: { '@sunpower/geocoding': fileURLToPath(new URL('./static/js/geocoding.js', import.meta.url)), '@ui/runtime': fileURLToPath(new URL('./src/components/NativeRuntime.jsx',import.meta.url)) } },
  optimizeDeps: { include: ['@sunpower/geocoding'] },
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    cors: { origin: /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ },
    // React owns HTML; authenticated APIs and uploads share its browser origin.
    proxy: { '/api': { target: process.env.DJANGO_ORIGIN || 'http://127.0.0.1:8000' }, '/media': { target: process.env.DJANGO_ORIGIN || 'http://127.0.0.1:8000' } },
  },
  build: {
    manifest: true,
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    clearMocks: true,
  },
}));

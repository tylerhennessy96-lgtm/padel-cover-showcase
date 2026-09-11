import { defineConfig } from 'vite';

export default defineConfig({
  base: './',   // relative asset paths so the build works under any URL (GitHub Pages subpath included)
  server: { host: true, port: 5174 },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
});

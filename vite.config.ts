import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './src-electron'),
    },
  },
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src-electron/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-react'],
  },
});


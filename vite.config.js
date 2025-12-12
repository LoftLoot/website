import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/website/', // GitHub Pages repo base path
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep assets organized
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  // Include these file types as assets so imports like import img from './image.png' work
  assetsInclude: [
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.svg',
    '**/*.woff',
    '**/*.woff2',
    '**/*.ttf'
  ]
});

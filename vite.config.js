import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/website/', 
  plugins: [react()],
  // FIX: Force single instance of React/Router to prevent "Dual React" errors
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  assetsInclude: [
    '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.woff', '**/*.woff2', '**/*.ttf'
  ]
});

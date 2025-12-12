import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  base: '/website/',
  plugins: [react()],
  resolve: {
    // Prevent "Dual React" issues by forcing a single instance
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: isSsrBuild 
        ? {
            // SSR Build: Keep filename fixed (no hash) so the node script can find it
            entryFileNames: '[name].js',
          }
        : {
            // Client Build: Use hashing for cache busting
            assetFileNames: 'assets/[name]-[hash][extname]',
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js'
          }
    }
  },
  assetsInclude: [
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.svg',
    '**/*.woff',
    '**/*.woff2',
    '**/*.ttf'
  ]
}));

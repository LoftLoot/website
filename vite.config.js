import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  base: '/website/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  // FIX: Force Vite to bundle this library so Node.js doesn't fail on named exports
  ssr: {
    noExternal: ['react-helmet-async'],
  },
  build: {
    rollupOptions: {
      output: isSsrBuild 
        ? {
            // SSR Build: Keep filename fixed for the prerender script
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

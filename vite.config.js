import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to slugify text
const slugify = text =>
  text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Read product data
const productsData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'src/products.json'), 'utf-8')
);

// Generate routes
const routes = ['/', '/about'];

// Add collections
const collections = new Set(productsData.map(p => p.collection));
collections.forEach(col => {
  if (col) routes.push(`/${slugify(col)}`);
});

// Add product routes
productsData.forEach(product => {
  const collectionSlug = slugify(product.collection || 'other');
  const itemSlug = slugify(
    `${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`
  );
  routes.push(`/${collectionSlug}/${itemSlug}`);
});

export default defineConfig({
  base: '/website/',
  plugins: [
    react(),
    vitePrerenderPlugin({
      routes,
      renderTarget: '#root',
      // Point to the .jsx file so Vite handles the transformation
      prerenderScript: path.resolve(__dirname, 'prerender.jsx'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});

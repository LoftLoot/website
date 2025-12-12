import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from 'vite-plugin-prerender-spa';
import path from 'path';
import fs from 'fs';

// Helper to slugify text (matching your app logic)
const slugify = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

// Read product data to generate routes
const productsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'src/products.json'), 'utf-8'));

// Generate Routes List
const routes = ['/', '/about'];

// Add Collections
const collections = new Set(productsData.map(p => p.collection));
collections.forEach(col => {
  if (col) routes.push(`/${slugify(col)}`);
});

// Add Products
productsData.forEach(product => {
  const collectionSlug = slugify(product.collection || "Other");
  const itemSlug = slugify(`${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`);
  routes.push(`/${collectionSlug}/${itemSlug}`);
});

export default defineConfig({
  base: '/website/', // Matches your homepage in package.json
  plugins: [
    react(),
    prerender({
      routes,
      staticDir: path.join(__dirname, 'dist'),
      // Optimization: Minify the generated HTML
      minify: {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        keepClosingSlash: true,
        sortAttributes: true,
      },
      // Ensure the renderer waits for the app to settle
      rendererOptions: {
        maxConcurrentRoutes: 5,
        renderAfterTime: 500, // wait 500ms for data/images to settle
      },
      postProcess(renderedRoute) {
        // Fix up paths for GitHub Pages /website/ subpath if needed
        renderedRoute.html = renderedRoute.html.replace(
          /http:\/\/localhost:\d+/g,
          'https://LoftLoot.github.io/website'
        );
        return renderedRoute;
      },
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
  }
});

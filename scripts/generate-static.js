// scripts/generate-static.js
const fs = require('fs');
const path = require('path');
const rawProducts = require('../src/products.json');

// --- CONFIG ---
const BASE_URL = "https://LoftLoot.github.io/website";

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX_HTML_PATH = path.join(BUILD_DIR, 'index.html');

if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error("Error: build/index.html not found. Run 'npm run build' first.");
    process.exit(1);
}

const template = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const sitemapUrls = [];

console.log("🚀 Starting Sitemap & 404 Generation...");

// 1. Add Home Page
sitemapUrls.push(`
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`);

// 2. Track Collections
const collections = new Set();

// 3. Process Products for Sitemap
rawProducts.forEach(product => {
    const collectionName = product.collection || "Other";
    const collectionSlug = slugify(collectionName);
    const itemSlug = slugify(`${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`);
    const fullSlug = `${collectionSlug}/${itemSlug}`;
    
    // Track collection for later
    collections.add(collectionName);

    sitemapUrls.push(`
      <url>
        <loc>${BASE_URL}/${fullSlug}/</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `);
});

// 4. Process Collections for Sitemap
collections.forEach(colName => {
    const slug = slugify(colName);
    sitemapUrls.push(`
      <url>
        <loc>${BASE_URL}/${slug}/</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
      </url>
    `);
});

// 5. Add Static Routes to Sitemap
const extraRoutes = ['about'];
extraRoutes.forEach(route => {
    sitemapUrls.push(`
      <url>
        <loc>${BASE_URL}/${route}/</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
      </url>
    `);
});

// 6. Generate 404.html (GitHub Pages Fallback)
// react-snap generates 200.html, but we often want a dedicated 404 too.
fs.writeFileSync(path.join(BUILD_DIR, '404.html'), template);
console.log(`✅ Generated: 404.html`);

// 7. Write Sitemap
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('')}
</urlset>`;

fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemapContent);
console.log(`🗺️  Sitemap generated with ${sitemapUrls.length} URLs!`);

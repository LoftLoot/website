// scripts/run-snap.js
const { run } = require('react-snap');
const fs = require('fs');
const path = require('path');
const rawProducts = require('../src/products.json');

// CONFIG
// Must match the "homepage" field in package.json
const PUBLIC_URL = "/website"; 
const DOMAIN = "https://LoftLoot.github.io";
const BUILD_DIR = path.join(__dirname, '..', 'build');

// Helper to match your App's slugify logic
const slugify = (text) => {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

// --- STEP 1: GENERATE PATHS ---
// We explicitly tell react-snap what paths to build. 
// This bypasses the crawler failure on subdirectories.
const paths = ['/', '/about'];

// Add Collection Pages
const collections = new Set(rawProducts.map(p => p.collection));
collections.forEach(col => {
    if (col) paths.push(`/${slugify(col)}`);
});

// Add Product Pages
rawProducts.forEach(product => {
    const collectionSlug = slugify(product.collection || "Other");
    const itemSlug = slugify(`${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`);
    paths.push(`/${collectionSlug}/${itemSlug}`);
});

console.log(`📸 Preparing to snap ${paths.length} routes...`);

// --- STEP 2: RUN REACT-SNAP ---
run({
    publicPath: PUBLIC_URL + "/", // Fixes asset loading in subdirectory
    include: paths,               // Feeds our explicit list
    crawl: false,                 // Disable crawler to prevent 404 errors
    asyncScriptTags: false,       // Fixes "Flash of Unstyled Content"
    concurrency: 4,
    puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    fixWebpackChunksIssue: "CRA",
    saveAs: 'html'
}).then(() => {
    console.log("✨ Snapshots complete!");

    // --- STEP 3: GENERATE SITEMAP ---
    console.log("🗺️  Generating Sitemap...");
    const sitemapUrls = paths.map(p => `
    <url>
        <loc>${DOMAIN}${PUBLIC_URL}${p === '/' ? '' : p}/</loc>
        <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
        <priority>${p === '/' ? '1.0' : '0.8'}</priority>
    </url>
    `).join('');

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>`;

    fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemapContent);
    console.log("✅ sitemap.xml created.");

    // --- STEP 4: FIX GITHUB PAGES 404 ---
    // react-snap creates a "200.html" as a fallback for SPA routing.
    // We copy this to "404.html" so GitHub Pages serves it.
    // Unlike copying index.html, 200.html is usually cleaner/unhydrated or specifically handled.
    // Ideally, you'd add '/404' to the paths list if you had a specific route, 
    // but copying 200.html is the standard react-snap fallback pattern.
    if (fs.existsSync(path.join(BUILD_DIR, '200.html'))) {
        fs.copyFileSync(path.join(BUILD_DIR, '200.html'), path.join(BUILD_DIR, '404.html'));
        console.log("✅ Copied 200.html to 404.html for GitHub Pages.");
    }

}).catch((error) => {
    console.error("❌ React Snap Failed:", error);
    process.exit(1);
});

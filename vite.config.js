import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// boilerplate for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// slug function
const slugify = text =>
  text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// read products.json
const productsData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'src/products.json'), 'utf-8')
)

// build routes
const routes = ['/', '/about']
const collections = new Set(productsData.map(p => p.collection))
collections.forEach(col => {
  if (col) routes.push(`/${slugify(col)}`)
})
productsData.forEach(product => {
  const collectionSlug = slugify(product.collection || 'other')
  const itemSlug = slugify(
    `${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`
  )
  routes.push(`/${collectionSlug}/${itemSlug}`)
})

// configure plugin
export default defineConfig({
  base: '/website/',
  plugins: [
    react(),
    vitePrerenderPlugin({
      routes,
      renderTarget: '#root',
      // you can customize the HTML insertion target if needed
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from 'vite-prerender-plugin'; // make sure installed

export default defineConfig({
  base: '/website/', // matches GitHub Pages repo name
  plugins: [
    react(),
    prerender({
      staticDir: 'dist',
      routes: ['/website/'], // match your StaticRouter basename
      postProcess(context) {
        // Inject prerendered HTML into <div id="root"></div>
        context.html = context.html.replace(
          /<div id="root"><\/div>/,
          `<div id="root">${context.renderedRoute}</div>`
        );
        return context;
      },
      // points to your prerender function
      render: (route) => import('./prerender.jsx').then(mod => mod.prerender(route)),
    }),
  ],
});

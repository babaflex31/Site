import { defineConfig } from 'astro/config';

export default defineConfig({
    // GitHub Pages configuration
    site: 'https://babaflex31.github.io',
    base: '/Flexlol/',

    // SSG output — zero runtime server
    output: 'static',

    // Build optimizations
    build: {
        inlineStylesheets: 'auto',
    },

    vite: {
        build: {
            // Target modern browsers only
            target: 'es2022',
            // Minimal chunk splitting for a single-page site
            cssMinify: 'lightningcss',
        },
    },
});

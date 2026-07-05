import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'og-image.svg'],
      manifest: {
        name: 'Allianz Egypt Medical Network',
        short_name: 'Allianz GN',
        description: 'Search the Allianz Egypt medical provider network: doctors, hospitals, pharmacies, labs and more.',
        theme_color: '#1a66db',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.xlsx$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'allianz-excel-data',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx'],
          leaflet: ['leaflet', 'leaflet.markercluster'],
          vendor: ['vue', '@vueuse/core', 'fuse.js'],
        },
      },
    },
  },
})

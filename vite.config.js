import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Enable PWA in development
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MenuMitra Customer App',
        short_name: 'MenuMitra',
        description: 'MenuMitra - Your Digital Restaurant Menu Solution',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/all-outlets',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        prefer_related_applications: false,
        categories: ['food', 'lifestyle'],
        shortcuts: [
          {
            name: "MenuMitra",
            url: "/all-outlets",
            icons: [{ src: "/icons/menu-shortcut.png", sizes: "96x96" }]
          }
        ],
        screenshots: [
          {
            src: "/screenshots/app-screen1.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "MenuMitra Home Screen"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/menu4\.xyz\/v2\.3\/user\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/menusmitra\.xyz\/v2\.3\/user\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-menusmitra',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/ghanish\.in\/media\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
              }
            }
          }
        ]
      }
    })
  ],
  base: '/',
})

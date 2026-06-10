import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Plugin: replaces __VITE_*__ placeholders in firebase-messaging-sw.js
// with actual env values at build time (service workers can't use import.meta.env)
function injectSwEnv(env) {
  return {
    name: 'inject-sw-env',
    closeBundle() {
      const swPath = resolve('dist', 'firebase-messaging-sw.js')
      try {
        let sw = readFileSync(swPath, 'utf-8')
        Object.keys(env).forEach(key => {
          sw = sw.replaceAll(`__${key}__`, env[key])
        })
        writeFileSync(swPath, sw)
      } catch {
        // SW file may not exist in dev mode — safe to ignore
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          skipWaiting: false,
          clientsClaim: true,
        },
        manifest: {
          name: 'Sepak Takraw Scoring',
          short_name: 'ST Score',
          description: 'League scoring app for Sepak Takraw',
          theme_color: '#1a1a2e',
          background_color: '#1a1a2e',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
      injectSwEnv(env),
    ],
    base: '/chennaisepaktakraw/',
  }
})

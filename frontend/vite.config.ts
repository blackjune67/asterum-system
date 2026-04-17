import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createDevBannerPlugin } from './src/devBannerPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createDevBannerPlugin('ASTERUM-SYSTEM-FRONT')],
  server: {
    proxy: {
      '/api': 'http://localhost:8083',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})

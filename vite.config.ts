import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/suggest-google': {
        target: 'https://suggestqueries.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggest-google/, ''),
      },
      '/api/suggest-duckduckgo': {
        target: 'https://duckduckgo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggest-duckduckgo/, ''),
      },
      '/api/suggest-bing': {
        target: 'https://api.bing.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggest-bing/, ''),
      },
      '/api/suggest-brave': {
        target: 'https://search.brave.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggest-brave/, ''),
      },
      '/api/suggest-ecosia': {
        target: 'https://ac.ecosia.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggest-ecosia/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
        },
      },
    },
  },
})

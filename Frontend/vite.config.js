import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split big eagerly-loaded vendors into their own cacheable chunks so no
        // single chunk trips the 500 kB warning. (Recharts and the task-detail
        // panel are already separate chunks via route/lazy splitting.) This Vite
        // (rolldown) requires manualChunks to be a FUNCTION, not an object.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('@tanstack') || id.includes('axios')) return 'vendor-data'
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react'
          }
          return undefined
        },
      },
    },
  },
})

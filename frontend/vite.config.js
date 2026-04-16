import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/identify': 'http://localhost:8000',
      '/care': 'http://localhost:8000',
      '/journal': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})

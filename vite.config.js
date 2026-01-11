import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/screenplay': 'http://localhost:3000',
      '/chat': 'http://localhost:3000',
      '/sdk': 'http://localhost:3000',
      '/api-docs': 'http://localhost:3000'
    }
  }
})

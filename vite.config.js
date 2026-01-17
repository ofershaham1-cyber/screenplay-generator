import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SERVER_URL = 'http://localhost:3000'

// Plugin to check server health on startup
const serverHealthCheckPlugin = {
  name: 'server-health-check',
  apply: 'serve',
  async configResolved() {
    // Check if server is running
    try {
      const response = await fetch(`${SERVER_URL}/api/models`, {
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) {
        console.log(`\n✓ Server is running at ${SERVER_URL}\n`)
      } else {
        console.warn(`\n⚠ Server at ${SERVER_URL} returned status ${response.status}\n`)
      }
    } catch (error) {
      console.error(`\n✗ ERROR: Cannot connect to server at ${SERVER_URL}`)
      console.error(`  Make sure the server is running: npm run start\n`)
    }
  }
}

export default defineConfig({
  plugins: [react(), serverHealthCheckPlugin],
  server: {
    proxy: {
      '/screenplay': SERVER_URL,
      '/chat': SERVER_URL,
      '/sdk': SERVER_URL,
      '/api-docs': SERVER_URL,
      '/api': SERVER_URL
    }
  }
})

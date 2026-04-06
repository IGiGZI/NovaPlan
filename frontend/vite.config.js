import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy API calls to the backend to avoid CORS during development
    proxy: {
      '/api/careers_data': {
        target: process.env.VITE_PYTHON_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/generate': {
        target: process.env.VITE_PYTHON_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/download': {
        target: process.env.VITE_PYTHON_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

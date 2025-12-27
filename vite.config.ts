import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {},
  },
  build: {
    outDir: 'dist',
  },
  define: {
    'process.env': {}
  }
})
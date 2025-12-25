
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat-sdk': {
        target: 'https://workigomchat.online',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chat-sdk/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  define: {
    'process.env': {}
  }
})

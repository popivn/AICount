import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/predict': {
        target: 'http://localhost:3838',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:3838',
        changeOrigin: true,
      },
    },
  },
})

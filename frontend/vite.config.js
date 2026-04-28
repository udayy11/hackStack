import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      '/api': 'https://hackstack-76mn.onrender.com/',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
    allowedHosts: ['nexchain-p1e4.onrender.com'], 
  },
})
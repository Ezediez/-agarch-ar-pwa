import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-new',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-2025-09-21-23-45.js`,
        chunkFileNames: `assets/[name]-2025-09-21-23-45.js`,
        assetFileNames: `assets/[name]-2025-09-21-23-45.[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    }
  }
})

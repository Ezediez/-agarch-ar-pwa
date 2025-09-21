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
        entryFileNames: `assets/[name]-${process.env.CACHE_BUST || 'default'}.js`,
        chunkFileNames: `assets/[name]-${process.env.CACHE_BUST || 'default'}.js`,
        assetFileNames: `assets/[name]-${process.env.CACHE_BUST || 'default'}.[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    }
  }
})

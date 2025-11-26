import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { viteSourceLocator } from '@metagptx/vite-plugin-source-locator';

export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: 'mgx',
    }),
    react(),
  ],
  
  // 🔥 KESİN 404 ÇÖZÜMÜ
  base: './', // Relative path kullan
  
  server: {
    watch: { usePolling: true, interval: 800 },
    host: true,
    port: 3000,
    // 🔥 BU ÖNEMLİ
    historyApiFallback: {
      disableDotRule: true,
      index: '/index.html'
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    // 🔥 STATIC ASSET'LER İÇİN
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
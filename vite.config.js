import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use SWC instead of Babel for better performance and fewer issues
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    port: 5100,
    strictPort: false,
    hmr: {
      overlay: true,
      port: 24678
    },
    // Force clear cache
    force: true
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
  // Clear dependency cache
  cacheDir: 'node_modules/.vite'
})

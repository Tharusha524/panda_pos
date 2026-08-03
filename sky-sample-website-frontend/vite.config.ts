import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_BASE_URL || 'https://finance.skytechsl.com/pos/backend/public').replace(/\/+$/, '')
  const basePath = env.VITE_BASE_PATH || '/pos/'

  return {
    base: basePath,
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/views/POS/')) {
              return 'pos';
            }
          },
        },
      },
    },
    server: {
      // Optional: leave VITE_API_BASE_URL empty and use relative /api via proxy
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})

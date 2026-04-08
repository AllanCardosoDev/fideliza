import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Base path: configure VITE_BASE_PATH in .env for subdirectory deploys
    // e.g. VITE_BASE_PATH=/fideliza/ for example.com/fideliza/
    base: env.VITE_BASE_PATH || '/',

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router-dom')
              ) {
                return 'vendor'
              }
            }
          },
        },
      },
    },
  }
})

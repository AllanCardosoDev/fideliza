import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy apenas em desenvolvimento local (npm run dev)
    // Em produção (build), as requisições vão direto para o Express server
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Build para produção
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

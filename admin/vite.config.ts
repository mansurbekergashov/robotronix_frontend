import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.BACKEND_URL || 'https://robotronix.uz';
  const backendWs  = backendUrl.replace(/^https/, 'wss');

  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: backendWs,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});


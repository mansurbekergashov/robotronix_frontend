import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.BACKEND_URL || 'https://robotronix.uz';
  const backendWs  = backendUrl.replace(/^http/, 'ws');

  const isHttps = backendUrl.startsWith('https');

  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        '/ws': {
          target: backendWs,
          ws: true,
          changeOrigin: true,
          secure: isHttps,
        },
      },
    },
  };
});


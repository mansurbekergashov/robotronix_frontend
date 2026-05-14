import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.BACKEND_URL || 'https://robotronix.uz';
  const backendWs  = backendUrl.replace(/^http/, 'ws');

  // Strip Origin/Referer so Spring's CORS filter doesn't activate.
  // The browser treats all Vite-proxied requests as same-origin, so it
  // never checks the response for CORS headers — removing Origin is safe.
  const stripCorsHeaders = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    });
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          configure: stripCorsHeaders,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          configure: stripCorsHeaders,
        },
        '/ws': {
          target: backendWs,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

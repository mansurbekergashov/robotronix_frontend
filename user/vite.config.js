import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.BACKEND_URL || 'https://robotronix.uz';
  const backendWs  = backendUrl.replace(/^http/, 'ws');

  // Strip Origin/Referer so Spring's CORS filter doesn't activate.
  const stripCorsHeaders = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    });
  };

  return {
    root: '.',
    // In dev, remove <base href="/user-panel/"> so assets resolve from root.
    // Production build keeps it — nginx rewrites /user-panel/ → / before serving.
    plugins: [
      {
        name: 'remove-base-href',
        transformIndexHtml(html) {
          return html.replace(/<base\s[^>]*href="[^"]*"[^>]*\/?>/i, '');
        },
      },
    ],
    server: {
      port: 3002,
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

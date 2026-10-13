import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks to `/api/*` on the Vite origin; Vite forwards those requests
// to VITE_API_BASE_URL. This same-origin proxy works with any backend build. The backend
// also ships CORS middleware (CORS_ORIGINS), so a deployed build can skip the proxy by
// setting VITE_API_DIRECT=true.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = (env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      // Ingestion happens inside the upload request and can take a while.
      timeout: 0,
      proxyTimeout: 0,
    },
  };

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  };
});

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev proxy target = wherever the backend actually listens. We read PORT from
  // backend/.env (same file the backend uses); if it's unset the backend falls
  // back to 3000 (see backend/src/config/config.ts). Override everything with
  // VITE_DEV_API_TARGET=http://localhost:1234 if needed.
  const backendEnv = loadEnv(mode, '../backend', '')
  const apiTarget =
    process.env.VITE_DEV_API_TARGET || `http://localhost:${backendEnv.PORT || 3000}`

  return {
    plugins: [react()],
    server: {
      // Same-origin API in dev (mirrors the Vercel `/api/*` rewrite), so the
      // HttpOnly auth cookie works without CORS gymnastics.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: false,
          // If the backend is down / on another port, say so (in the terminal AND in the
          // UI error banner) instead of an opaque "502".
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              const message = `Cannot reach the backend at ${apiTarget} (${(err as NodeJS.ErrnoException).code ?? err.message}). Start it with "npm run dev" in /backend and check its terminal for errors.`
              console.error(`\n[vite proxy] ${message}\n`)
              if ('writeHead' in res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, message }))
              }
            })
          },
        },
      },
    },
  }
})

// Same-origin by default: on Vercel the `/api/*` rewrite routes to the backend
// service, and in `vite dev` the proxy in vite.config.ts does the same. Set
// VITE_API_URL only if the API lives on a different origin (cookies then need
// matching CORS + SameSite settings on the server).
export const API_URL: string = import.meta.env.VITE_API_URL || '';

// Fired when any API call comes back 401 (e.g. the session expired mid-use),
// so AuthContext can drop the user and the route guards send them to /login.
export const UNAUTHORIZED_EVENT = 'codeastra:unauthorized';

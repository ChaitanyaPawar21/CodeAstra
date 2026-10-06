import type { AuthUser } from "./type.js";

// passport's typings already declare `Request.user?: Express.User`. Extending
// `Express.User` (instead of re-declaring `user`) keeps both in sync, so
// `req.user` is a fully typed AuthUser everywhere.
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}
  }
}

export {};

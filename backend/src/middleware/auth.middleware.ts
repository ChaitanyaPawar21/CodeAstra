import type { NextFunction, Request, Response } from "express";
import {
  AUTH_COOKIE_NAME,
  AuthError,
  getUserForToken,
  verifyToken,
} from "../services/auth.service.js";

/** HttpOnly cookie first (browser app); `Authorization: Bearer` as a fallback for API clients. */
const extractToken = (req: Request): string | null => {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    return token || null;
  }
  return null;
};

/**
 * Protects a route. On success `req.user` is a typed AuthUser derived purely
 * from the verified JWT + database — never from anything the client sent in
 * the body/query. Any failure → 401.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthError("Authentication required.", 401, "NO_TOKEN");
    }
    const { userId, issuedAt } = verifyToken(token);
    req.user = await getUserForToken(userId, issuedAt);
    next();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ success: false, message: err.message, code: err.code });
      return;
    }
    console.error("[Auth] Middleware error:", (err as Error).message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default authMiddleware;

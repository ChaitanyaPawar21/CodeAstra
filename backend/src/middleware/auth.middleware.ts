import type { NextFunction, Request, Response } from "express";
import {
  AUTH_COOKIE_NAME,
  AuthError,
  getUserForToken,
  verifyToken,
} from "../services/auth.service.js";

/** Extract JWT from cookie first, then Authorization header. */
const extractToken = (req: Request): string | null => {
  const cookieToken = (
    req.cookies as Record<string, string> | undefined
  )?.[AUTH_COOKIE_NAME];

  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    return token || null;
  }

  return null;
};

/** Authenticate the user and attach their login session ID. */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthError(
        "Authentication required.",
        401,
        "NO_TOKEN",
      );
    }

    const { userId, issuedAt, sessionId } = verifyToken(token);

    const user = await getUserForToken(userId, issuedAt);

    req.user = user;

    // This ID remains the same while the JWT remains the same.
    res.locals.chatSessionId = sessionId;

    next();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({
        success: false,
        message: err.message,
        code: err.code,
      });
      return;
    }

    console.error(
      "[Auth] Middleware error:",
      (err as Error).message,
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default authMiddleware;
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import type { CookieOptions, Response } from "express";
import { config } from "../config/config.js";
import userModel, { IUser } from "../models/user.model.js";
import type { AuthUser } from "../types/type.js";

/* -------------------------------------------------------------------------- */
/*  Errors                                                                    */
/* -------------------------------------------------------------------------- */

/** An error that is safe to show to the client (message + HTTP status). */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

/* -------------------------------------------------------------------------- */
/*  Cookie helpers (JWT transport)                                            */
/* -------------------------------------------------------------------------- */

export const AUTH_COOKIE_NAME = "codeastra_token";
export const OAUTH_STATE_COOKIE_NAME = "codeastra_oauth_state";

// SameSite=Lax: sent on same-site requests and top-level navigations (needed
// for the Google redirect back to us) but NOT on cross-site POSTs → CSRF-safe
// for our POST endpoints. Secure is forced on in production.
const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
});

export const setAuthCookie = (res: Response, token: string): void => {
  // Cookie lifetime mirrors the token's own `exp`, whatever JWT_EXPIRES_IN is.
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const maxAge = decoded?.exp ? decoded.exp * 1000 - Date.now() : undefined;
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions(), maxAge });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
};

export const setOAuthStateCookie = (res: Response, state: string): void => {
  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...baseCookieOptions(),
    maxAge: 10 * 60 * 1000,
  });
};

export const clearOAuthStateCookie = (res: Response): void => {
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, baseCookieOptions());
};

/* -------------------------------------------------------------------------- */
/*  bcrypt                                                                    */
/* -------------------------------------------------------------------------- */

const BCRYPT_ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, BCRYPT_ROUNDS);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

// Used to burn the same CPU time when the email doesn't exist, so response
// timing doesn't reveal which emails are registered.
let dummyHashPromise: Promise<string> | null = null;
const getDummyHash = (): Promise<string> =>
  (dummyHashPromise ??= hashPassword("codeastra-dummy-password"));

/* -------------------------------------------------------------------------- */
/*  JWT                                                                       */
/* -------------------------------------------------------------------------- */

interface TokenPayload {
  userId: string;
}

export const generateToken = (userId: string): string =>
  jwt.sign({ userId } satisfies TokenPayload, config.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export const verifyToken = (token: string): { userId: string; issuedAt: number } => {
  let decoded: string | jwt.JwtPayload;
  try {
    // Pin the algorithm: never let the token pick its own (alg confusion / "none").
    decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED");
    }
    throw new AuthError("Invalid authentication token.", 401, "INVALID_TOKEN");
  }

  const userId = typeof decoded === "object" ? decoded.userId : undefined;
  if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
    throw new AuthError("Invalid authentication token.", 401, "INVALID_TOKEN");
  }
  return { userId, issuedAt: (decoded as jwt.JwtPayload).iat ?? 0 };
};

/* -------------------------------------------------------------------------- */
/*  Users                                                                     */
/* -------------------------------------------------------------------------- */

export const toAuthUser = (user: IUser): AuthUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  provider: user.provider,
  createdAt: user.createdAt,
});

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export const registerUser = async (input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> => {
  const email = input.email.toLowerCase();

  if (await userModel.exists({ email })) {
    throw new AuthError("An account with this email already exists.", 409, "EMAIL_TAKEN");
  }

  const password = await hashPassword(input.password);
  let user: IUser;
  try {
    user = await userModel.create({
      name: input.name,
      email,
      password,
      provider: "local",
    });
  } catch (err) {
    // Two simultaneous registrations can both pass the check above; the unique
    // index is the real guarantee.
    if (isDuplicateKeyError(err)) {
      throw new AuthError("An account with this email already exists.", 409, "EMAIL_TAKEN");
    }
    throw err;
  }
  return { user: toAuthUser(user), token: generateToken(String(user._id)) };
};

export const loginUser = async (input: {
  email: string;
  password: string;
}): Promise<AuthResult> => {
  const user = await userModel
    .findOne({ email: input.email.toLowerCase() })
    .select("+password");

  // Same error for "no such user", "Google-only account" and "wrong password".
  const invalid = new AuthError("Invalid email or password.", 401, "INVALID_CREDENTIALS");

  if (!user || !user.password) {
    await comparePassword(input.password, await getDummyHash());
    throw invalid;
  }
  if (!(await comparePassword(input.password, user.password))) {
    throw invalid;
  }
  return { user: toAuthUser(user), token: generateToken(String(user._id)) };
};

/** Create a single-use password reset token for an existing local account. */
export const createPasswordReset = async (email: string): Promise<{ token: string; name: string } | null> => {
  const user = await userModel.findOne({ email: email.toLowerCase() }).select("+password");
  // Google-only accounts do not have a password to reset.
  if (!user?.password) return null;

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  return { token, name: user.name };
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await userModel.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");
  if (!user) throw new AuthError("This password reset link is invalid or expired. Request a new one.", 400, "INVALID_RESET_TOKEN");

  user.password = await hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  // JWT iat has one-second precision; move the cutoff forward so all earlier
  // sessions are rejected, including tokens issued in the same second.
  user.tokensValidAfter = new Date(Date.now() + 1000);
  await user.save();
};

/**
 * Resolve a verified token to a live user. Rejects tokens for deleted users and
 * tokens issued before the account's credentials were last invalidated.
 */
export const getUserForToken = async (
  userId: string,
  issuedAt: number,
): Promise<AuthUser> => {
  const user = await userModel.findById(userId).select("+tokensValidAfter");
  if (!user) {
    throw new AuthError("Account no longer exists.", 401, "USER_NOT_FOUND");
  }
  if (user.tokensValidAfter && issuedAt < Math.floor(user.tokensValidAfter.getTime() / 1000)) {
    throw new AuthError("Session is no longer valid. Please log in again.", 401, "TOKEN_REVOKED");
  }
  return toAuthUser(user);
};

/* -------------------------------------------------------------------------- */
/*  Google OAuth 2.0                                                          */
/* -------------------------------------------------------------------------- */

export interface GoogleProfileInput {
  googleId: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
}

/**
 * Find or create the CodeAstra user for a Google identity.
 *
 *  1. Known googleId            → that user.
 *  2. Same (Google-verified) email already registered → LINK, don't duplicate.
 *     Local emails are not verified in this app, so someone could have
 *     pre-registered a victim's address with a password they know. When Google
 *     proves ownership of the address we therefore (a) drop the local password
 *     and (b) invalidate tokens issued before now. The real owner keeps access
 *     via Google.
 *  3. Otherwise                 → create a new Google user.
 */
export const findOrCreateGoogleUser = async (
  profile: GoogleProfileInput,
): Promise<AuthUser> => {
  const byGoogleId = await userModel.findOne({ googleId: profile.googleId });
  if (byGoogleId) return toAuthUser(byGoogleId);

  if (!profile.email || !profile.emailVerified) {
    throw new AuthError(
      "Your Google account does not have a verified email address.",
      403,
      "GOOGLE_EMAIL_UNVERIFIED",
    );
  }
  const email = profile.email.toLowerCase();

  const byEmail = await userModel.findOne({ email });
  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.googleId) {
      throw new AuthError(
        "This email is already linked to a different Google account.",
        409,
        "GOOGLE_ACCOUNT_CONFLICT",
      );
    }
    byEmail.googleId = profile.googleId;
    byEmail.provider = "google";
    byEmail.password = undefined; // $unset the local credential
    byEmail.tokensValidAfter = new Date(); // revoke every token issued so far
    await byEmail.save();
    return toAuthUser(byEmail);
  }

  try {
    const created = await userModel.create({
      name: profile.name?.trim() || email.split("@")[0],
      email,
      googleId: profile.googleId,
      provider: "google",
    });
    return toAuthUser(created);
  } catch (err) {
    // Concurrent first-time callbacks: the other request won, so reuse its user.
    if (isDuplicateKeyError(err)) {
      const existing = await userModel.findOne({ $or: [{ googleId: profile.googleId }, { email }] });
      if (existing) return toAuthUser(existing);
    }
    throw err;
  }
};

export const authService = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  createPasswordReset,
  resetPassword,
  getUserForToken,
  findOrCreateGoogleUser,
};
export default authService;

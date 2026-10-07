import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { z } from "zod";
import nodemailer from "nodemailer";
import { config, isGoogleOAuthConfigured, isSmtpConfigured } from "../config/config.js";
import authService, {
  AuthError,
  OAUTH_STATE_COOKIE_NAME,
  clearAuthCookie,
  clearOAuthStateCookie,
  setAuthCookie,
  setOAuthStateCookie,
} from "../services/auth.service.js";

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "A valid email address is required" }));

// bcrypt only uses the first 72 BYTES of the input, so reject longer passwords
// rather than silently truncating them.
const passwordSchema = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 bytes")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Password must contain at least one letter and one number");

const registerSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(1, "Name is required").max(100, "Name is too long"),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  // No strength rules at login — only presence.
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({ email: emailSchema });
const resetPasswordSchema = z.object({
  token: z.string({ error: "Reset token is required" }).min(1, "Reset token is required"),
  password: passwordSchema,
});

const sendValidationError = (res: Response, error: z.ZodError): void => {
  res.status(400).json({
    success: false,
    message: error.issues[0]?.message ?? "Invalid input",
    errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  });
};

/** AuthError → its own status; anything else → generic 500 (no internals leaked). */
const handleError = (res: Response, err: unknown, context: string): void => {
  if (err instanceof AuthError) {
    res.status(err.status).json({ success: false, message: err.message, code: err.code });
    return;
  }
  console.error(`[Auth] ${context} failed:`, (err as Error).message);
  res.status(500).json({ success: false, message: "Internal server error" });
};

/* -------------------------------------------------------------------------- */
/*  Local auth                                                                */
/* -------------------------------------------------------------------------- */

export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const { user, token } = await authService.registerUser(parsed.data);
    setAuthCookie(res, token);
    res.status(201).json({ success: true, message: "Registration successful", data: { user } });
  } catch (err) {
    handleError(res, err, "Register");
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const { user, token } = await authService.loginUser(parsed.data);
    setAuthCookie(res, token);
    res.status(200).json({ success: true, message: "Login successful", data: { user } });
  } catch (err) {
    handleError(res, err, "Login");
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const parsed = forgotPasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (!isSmtpConfigured()) {
    res.status(503).json({ success: false, message: "Password reset email is not configured on this server." });
    return;
  }

  try {
    const reset = await authService.createPasswordReset(parsed.data.email);
    if (reset) {
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
      });
      const link = `${frontendUrl("/reset-password")}?token=${encodeURIComponent(reset.token)}`;
      await transporter.sendMail({
        from: config.SMTP_FROM,
        to: parsed.data.email,
        subject: "Reset your CodeAstra password",
        text: `Hi ${reset.name},\n\nUse this link to set a new password. It expires in one hour:\n${link}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hi ${escapeHtml(reset.name)},</p><p>Use the link below to set a new password. It expires in one hour.</p><p><a href="${link}">Reset your CodeAstra password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      });
    }
    // Same response whether the account exists or not, to prevent email enumeration.
    res.status(200).json({ success: true, message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    handleError(res, err, "Forgot password");
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const parsed = resetPasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) return sendValidationError(res, parsed.error);
  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    res.status(200).json({ success: true, message: "Password updated. You can now log in." });
  } catch (err) {
    handleError(res, err, "Reset password");
  }
};

const escapeHtml = (value: string): string => {
  const replacements: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => replacements[char]);
};

/** Mounted behind authMiddleware, so req.user is guaranteed. */
export const me = (req: Request, res: Response): void => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

export const logout = (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: "Logged out" });
};

/* -------------------------------------------------------------------------- */
/*  Google OAuth 2.0                                                          */
/* -------------------------------------------------------------------------- */

const frontendUrl = (path: string): string => {
  const base = config.FRONTEND_URL.split(",")[0].trim().replace(/\/+$/, "");
  return `${base}${path}`;
};

const googleDisabled = (res: Response): void => {
  res.status(503).json({ success: false, message: "Google sign-in is not configured on this server." });
};

/** Step 1 — send the browser to Google's consent screen. */
export const googleAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!isGoogleOAuthConfigured()) return googleDisabled(res);

  // CSRF protection for the OAuth round trip: random `state`, remembered in a
  // short-lived HttpOnly cookie, and compared again in the callback.
  const state = crypto.randomBytes(24).toString("hex");
  setOAuthStateCookie(res, state);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
    state,
  })(req, res, next);
};

/** Step 2 — Google redirects back here with ?code&state. */
export const googleCallback = (req: Request, res: Response, next: NextFunction): void => {
  if (!isGoogleOAuthConfigured()) return googleDisabled(res);

  const fail = (reason: string) => res.redirect(frontendUrl(`/login?error=${reason}`));

  const expectedState = (req.cookies as Record<string, string> | undefined)?.[OAUTH_STATE_COOKIE_NAME];
  const receivedState = typeof req.query.state === "string" ? req.query.state : "";
  clearOAuthStateCookie(res); // single use

  const a = Buffer.from(expectedState ?? "");
  const b = Buffer.from(receivedState);
  if (!expectedState || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return fail("google_state_mismatch");
  }
  if (req.query.error) return fail("google_denied");

  passport.authenticate("google", { session: false }, (err: unknown, user: Express.User | false | null) => {
    if (err) {
      if (err instanceof AuthError) return fail(err.code.toLowerCase());
      console.error("[Auth] Google callback failed:", (err as Error).message);
      return fail("google_failed");
    }
    if (!user) return fail("google_failed");

    setAuthCookie(res, authService.generateToken(user.id));
    res.redirect(frontendUrl("/dashboard"));
  })(req, res, next);
};

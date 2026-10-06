import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config, isGoogleOAuthConfigured } from "./config.js";
import authService from "../services/auth.service.js";

/**
 * Registers the Google OAuth 2.0 strategy. Sessions are NOT used — passport only
 * performs the OAuth handshake; our own JWT is what authenticates API calls.
 */
export const configurePassport = (): void => {
  if (!isGoogleOAuthConfigured()) {
    console.warn(
      "[Auth] Google OAuth is disabled (set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL to enable).",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const primary = profile.emails?.[0] as { value?: string; verified?: boolean | string } | undefined;
          const raw = (profile as unknown as { _json?: { email_verified?: boolean | string } })._json;
          const verifiedFlag = primary?.verified ?? raw?.email_verified;

          const user = await authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email: primary?.value,
            emailVerified: verifiedFlag === true || verifiedFlag === "true",
            name: profile.displayName,
          });
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
};

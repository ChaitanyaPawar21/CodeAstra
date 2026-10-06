import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory first, then workspace root as fallback
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.PORT) {
  throw new Error("PORT is not defined in environment variables");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not defined in environment variables");
}

if(!process.env.NVIDIA_API_KEY) {
  throw new Error("NVIDIA_API_KEY is not defined in environment variables")
}

// --- Authentication ---------------------------------------------------------
// JWT_SECRET is mandatory: without it tokens could not be signed/verified safely.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "[Config] JWT_SECRET is shorter than 32 characters — use a long random value (see .env.example).",
  );
}

const isProduction = process.env.NODE_ENV === "production";

export const config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || "",

  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: isProduction,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Where the browser app lives. Used for CORS and for the post-OAuth redirect.
  // Comma-separated list is allowed for CORS; the FIRST entry is the redirect target.
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  // Google OAuth 2.0 — optional. If any value is missing, the Google routes
  // respond 503 and the rest of the app (incl. local login) keeps working.
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "",
};

export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(
    config.GOOGLE_CLIENT_ID &&
      config.GOOGLE_CLIENT_SECRET &&
      config.GOOGLE_CALLBACK_URL,
  );

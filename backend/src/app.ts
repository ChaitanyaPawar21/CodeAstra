
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";

import { config } from "./config/config.js";
import { configurePassport } from "./config/passport.js";

import analysisRouter from "./routes/repoAnalysis.route.js";
import authRouter from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";

const app = express();

// CORS configuration
const allowedOrigins = config.FRONTEND_URL
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""));

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Passport configuration
configurePassport();
app.use(passport.initialize());

// Home route
app.get("/", async (req: Request, res: Response): Promise<any> => {
  res.send("Hello from server");
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/chat", chatRoutes);

export default app;

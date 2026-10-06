import express, { Request, Response } from "express";
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { config } from "./config/config.js";
import { configurePassport } from "./config/passport.js";
import analysisRouter from "./routes/repoAnalysis.route.js"
import authRouter from "./routes/auth.route.js"

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))
// Cookie-based auth needs an explicit origin allow-list + credentials
// (a wildcard origin is rejected by browsers when credentials are included).
const allowedOrigins = config.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/+$/, ""));
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(cookieParser())

configurePassport();
app.use(passport.initialize())

app.get("/", async(req: Request, res: Response): Promise<any> =>{
    res.send("Hello from server")
})

app.use("/api/auth", authRouter);
app.use("/api/analysis", analysisRouter);

export default app;
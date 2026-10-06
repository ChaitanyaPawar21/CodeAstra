import {Router} from "express";
import { analyzeRepo } from "../controllers/analysis.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, analyzeRepo)

export default router
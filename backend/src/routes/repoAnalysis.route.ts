import {Router} from "express";
import { analyzeRepo } from "../controllers/analysis.controller.js";

const router = Router();

router.post("/", analyzeRepo)

export default router
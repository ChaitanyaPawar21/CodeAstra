
import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/chat
// Verify authentication before executing the chatbot controller
router.post("/", authMiddleware, chatController);

export default router;

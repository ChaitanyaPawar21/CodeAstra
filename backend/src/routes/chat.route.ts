
import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Only authenticated users can access the chatbot.
router.post("/", authMiddleware, chatController);

export default router;

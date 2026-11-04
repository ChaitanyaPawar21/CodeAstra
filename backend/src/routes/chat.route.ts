import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Authenticate the user before processing chat requests.
router.post("/", authMiddleware, chatController);

export default router;
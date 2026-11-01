// backend/src/routes/chat.route.ts
import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";


const router = Router();

router.post("/", chatController); // POST /api/chat

export default router;

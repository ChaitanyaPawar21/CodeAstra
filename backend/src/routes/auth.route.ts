import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/logout", logout);

// Protected
router.get("/me", authMiddleware, me);

export default router;

// backend/src/controllers/chat.controller.ts
import { Request, Response } from "express";
import { askRepoAssistant, ChatMessage } from "../services/chat.service.js";


export const chatController = async (req: Request, res: Response) => {
  try {
    const { message, history = [], repoUrl, repoName, analysis } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history.filter(
          (m: any) =>
            (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string"
        )
      : [];

    const reply = await askRepoAssistant({
      message: message.trim().slice(0, 2000),
      history: safeHistory,
      repoUrl,
      repoName,
      analysis,
    });

    return res.json({ reply });
  } catch (err: any) {
    console.error("[chat] error:", err.message);
    return res.status(500).json({ error: err.message || "Chat failed" });
  }
};

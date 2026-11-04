import type { Request, Response } from "express";
import mongoose from "mongoose";

import Chat from "../models/chat.model.js";
import {
  askRepoAssistant,
  type ChatMessage,
} from "../services/chat.service.js";

export const chatController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      message,
      history = [],
      repoUrl,
      repoName,
      analysis,
    } = req.body ?? {};

    // Validate the user's question.
    if (typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        error: "Message is required",
      });
      return;
    }

    // Ensure the request has an authenticated user.
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    // Get the session ID set by authMiddleware.
    const sessionId = res.locals.chatSessionId as
      | string
      | undefined;

    if (!sessionId) {
      res.status(401).json({
        error: "Invalid chat session. Please log in again.",
      });
      return;
    }

    const question = message.trim().slice(0, 2000);

    // Accept only valid conversation history messages.
    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (m: any) =>
              (m?.role === "user" || m?.role === "assistant") &&
              typeof m?.content === "string",
          )
          .slice(-4)
          .map((m: any) => ({
            role: m.role,
            content: m.content.slice(0, 1000),
          }))
      : [];

    // Save the user's question in their current login session.
    // AI responses are deliberately NOT stored.
    await Chat.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(user.id),
        sessionId,
      },
      {
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(user.id),
          userName: user.name,
          sessionId,
        },
        $push: {
          questions: question,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    // Generate the AI response using the existing chatbot service.
    const reply = await askRepoAssistant({
      message: question,
      history: safeHistory,
      repoUrl,
      repoName,
      analysis,
    });

    // Return the AI response without saving it to MongoDB.
    res.json({ reply });
  } catch (err) {
    const error = err as Error;

    console.error("[chat] error:", error.message);

    res.status(500).json({
      error: error.message || "Chat failed",
    });
  }
};
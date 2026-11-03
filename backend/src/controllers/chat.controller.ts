
import type { Request, Response } from "express";
import { askRepoAssistant } from "../services/chat.service.js";
import type { ChatMessage } from "../services/chat.service.js";
import Chat from "../models/chat.model.js";

export const chatController = async (req: Request, res: Response) => {
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
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // Get authenticated user information.
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    // Get the verified login session ID from auth middleware.
    const sessionId = res.locals.chatSessionId;

    if (typeof sessionId !== "string" || !sessionId) {
      return res.status(401).json({
        error: "Invalid login session",
      });
    }

    const userId = user.id;
    const userName = user.name;

    const question = message.trim().slice(0, 2000);

    // Save the question in the document belonging to this login session.
    // If the document does not exist, MongoDB creates it.
    await Chat.findOneAndUpdate(
      {
        userId,
        sessionId,
      },
      {
        $setOnInsert: {
          userId,
          userName,
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
      }
    );

    // Keep only valid chat history messages for the AI.
    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history.filter(
          (m: any) =>
            (m?.role === "user" || m?.role === "assistant") &&
            typeof m?.content === "string"
        )
      : [];

    // Generate the AI response.
    const reply = await askRepoAssistant({
      message: question,
      history: safeHistory,
      repoUrl,
      repoName,
      analysis,
    });

    // Return the AI response without saving it in MongoDB.
    return res.json({ reply });

  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Chat failed";

    console.error("[chat] error:", errorMessage);

    return res.status(500).json({
      error: errorMessage,
    });
  }
};

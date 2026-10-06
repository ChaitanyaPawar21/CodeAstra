import { Request, Response } from "express";
import crypto from "crypto";
import aiService from "../services/ai.service.js";
import  analysisDAO  from "../dao/analysis.dao.js";

export const analyzeRepo = async (req: Request, res: Response) => {
  // Identity comes ONLY from the verified JWT (authMiddleware). Any userId the
  // client puts in the body is ignored.
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }
  const userId = req.user.id;

  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== "string") {
    res.status(400).json({ success: false, message: "repoUrl is required" });
    return;
  }
  const cleanUrl = repoUrl.trim();
  const repoUrlHash = crypto
    .createHash("sha256")
    .update(cleanUrl)
    .digest("hex");
  try {
    // Prefer the caller's own completed analysis; otherwise reuse anyone's
    // cached result (public repo, same output) but record a copy owned by this user.
    let cached = await analysisDAO.findByUrlHashForUser(repoUrlHash, userId);
    if (!cached) {
      const shared = await analysisDAO.findByUrlHash(repoUrlHash);
      if (shared) {
        cached = await analysisDAO.createCompletedCopy(shared, userId, crypto.randomUUID());
      }
    }
    if (cached) {
      res.status(200).json({
        success: true,
        cached: true,
        message: "Returning cached analysis",
        data: cached.result,
        analysisId: cached._id,
      });
      return;
    }
  } catch (err) {
    console.error("[Controller] Cache lookup failed:", err);
  }

  let record;
  try {
    record = await analysisDAO.create({
      userId,
      repoUrl: cleanUrl,
      repoUrlHash,
      jobId: crypto.randomUUID(),
    });
  } catch (err) {
    console.error("[Controller] DB create error:", err); // ADD THIS
    res.status(500).json({
      success: false,
      message: "Failed to initialise analysis record",
    });
    return;
  }

  const id = (record._id as unknown as string).toString();

  await analysisDAO.markActive(id);

  let aiResult;
  try {
    aiResult = await aiService.analyseRepository(cleanUrl);
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[Controller] Analysis threw:", msg);
    await analysisDAO.markFailed(id, msg);
    res.status(500).json({ success: false, message: "Analysis failed", errors: [msg] });
    return;
  }

  if (!aiResult.success || !aiResult.result) {
    await analysisDAO.markFailed(id, aiResult.errors.join(" | "));
    res.status(500).json({
      success: false,
      message: "Analysis failed",
      errors: aiResult.errors,
    });
    return;
  }

  const updated = await analysisDAO.markCompleted(id, aiResult.result);
  res.status(200).json({
    success: true,
    cached: false,
    message: "Analysis completed",
    data: updated?.result,
    analysisId: updated?._id,
    warnings: aiResult.errors.length ? aiResult.errors : undefined,
  });
};

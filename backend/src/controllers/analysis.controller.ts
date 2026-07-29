import { Request, Response } from "express";
import aiService from "../services/ai.service.js";
import { analysisDao } from "../dao/analysis.dao.js";

export const analyzeRepo = async (req: Request, res: Response) => {
  try {
    const { repoUrl } = req.body;

    console.log(repoUrl);
    

    if (!repoUrl || typeof repoUrl! == "string") {
      return res.status(400).json({
        success: false,
        message: "A valid 'repoUrl' string is required in request body.",
      });
    }

    const existingAnalysis = await analysisDao.findByRepoUrl(repoUrl);

    if (existingAnalysis) {
      console.log(`⚡ [Controller] Cache Hit for: ${repoUrl}`);
      return res.status(200).json({
        success: true,
        cached: true,
        message: "Repository analysis fetched from database",
        data: existingAnalysis,
      });
    }

    const analysisResult = await aiService.analyseRepository(repoUrl);

    if (!analysisResult.success || !analysisResult.result) {
      return res.status(500).json({
        success: false,
        message: "Failed to analyze repository",
        errors: analysisResult.errors,
      });
    }

    const savedDoc = await analysisDao.createAnalysis({
      repoUrl,
      m1: analysisResult.result.m1,
      m2: analysisResult.result.m2,
      m3: analysisResult.result.m3,
    });

    return res.status(201).json({
      success: true,
      cached: false,
      message: "Repository analyzed successfully",
      data: savedDoc,
    });
  } catch (error: any) {
    console.error("[Analysis Controller Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during repository analysis",
      error: error.message,
    });
  }
};

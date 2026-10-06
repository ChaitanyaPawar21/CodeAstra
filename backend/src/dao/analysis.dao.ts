import repoAnalysisModel, {
  IRepoAnalysis,
  IAnalysisResult,
} from "../models/repoAnalysis.model.js";
import { ANALYSIS_VERSION } from "../services/repograph/types.js";

export class AnalysisDAO {
  async findByUrlHash(repoUrlHash: string): Promise<IRepoAnalysis | null> {
    // Only serve cache produced by the current pipeline version; older rows
    // (or pre-versioning rows with no field) force a fresh analysis.
    return repoAnalysisModel
      .findOne({ repoUrlHash, status: "completed", analysisVersion: { $gte: ANALYSIS_VERSION } })
      .exec();
  }

  /** The given user's own completed analysis for this repo, if any. */
  async findByUrlHashForUser(
    repoUrlHash: string,
    userId: string,
  ): Promise<IRepoAnalysis | null> {
    return repoAnalysisModel
      .findOne({ repoUrlHash, userId, status: "completed", analysisVersion: { $gte: ANALYSIS_VERSION } })
      .exec();
  }

  /**
   * Cache hit on someone else's analysis: store a completed copy that belongs to
   * the requesting user so their history/ownership is correct without re-running the AI.
   */
  async createCompletedCopy(
    source: IRepoAnalysis,
    userId: string,
    jobId: string,
  ): Promise<IRepoAnalysis> {
    return repoAnalysisModel.create({
      userId,
      repoUrl: source.repoUrl,
      repoUrlHash: source.repoUrlHash,
      jobId,
      status: "completed",
      result: source.toObject().result,
      analysisVersion: source.analysisVersion,
      error: null,
      completedAt: new Date(),
    });
  }

  async create(data: {
    userId: string;
    repoUrl: string;
    repoUrlHash: string;
    jobId: string;
  }): Promise<IRepoAnalysis> {
    return repoAnalysisModel.create({
      ...data,
      status: "waiting",
      error: null,
      completedAt: null,
    });
  }

  async markActive(id: string): Promise<void> {
    await repoAnalysisModel.findByIdAndUpdate(id, { status: "active" });
  }

  async markCompleted(
    id: string,
    result: IAnalysisResult,
  ): Promise<IRepoAnalysis | null> {
    return repoAnalysisModel.findByIdAndUpdate(
      id,
      { status: "completed", result, analysisVersion: ANALYSIS_VERSION, error: null, completedAt: new Date() },
      { new: true },
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await repoAnalysisModel.findByIdAndUpdate(id, {
      status: "failed",
      error,
      completedAt: new Date(),
    });
  }

  async findByRepoUrl(repoUrl: string): Promise<IRepoAnalysis | null> {
    return repoAnalysisModel.findOne({ repoUrl }).exec();
  }
}

export const analysisDAO = new AnalysisDAO();
export default analysisDAO;

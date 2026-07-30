import repoAnalysisModel, {
  IRepoAnalysis,
  IAnalysisResult,
} from "../models/repoAnalysis.model.js";

export class AnalysisDAO {
  async findByUrlHash(repoUrlHash: string): Promise<IRepoAnalysis | null> {
    return repoAnalysisModel
      .findOne({ repoUrlHash, status: "completed" })
      .exec();
  }

  async create(data: {
    userId: null;
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
      { status: "completed", result, error: null, completedAt: new Date() },
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

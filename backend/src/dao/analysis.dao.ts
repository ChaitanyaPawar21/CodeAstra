import repoAnalysisModel, {
  IRepoAnalysis,
} from "../models/repoAnalysis.model.js";

export class AnalysisDAO {
  async findByRepoUrl(repoUrl: string): Promise<IRepoAnalysis | null> {
    return await repoAnalysisModel.findOne({ repoUrl }).exec();
  }

  async createAnalysis(data: {
    repoUrl: string;
    m1: IRepoAnalysis["m1"];
    m2: IRepoAnalysis["m2"];
    m3: IRepoAnalysis["m3"];
  }): Promise<IRepoAnalysis> {
    return await repoAnalysisModel.create(data);
  }
}

export const analysisDao = new AnalysisDAO();
export default analysisDao;
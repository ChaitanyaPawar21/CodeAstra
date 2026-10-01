import { RepoMeta } from "../github.service.js";
import { RepoGraph } from "./types.js";
import { fetchRepoFiles } from "./fetch.js";
import { buildRepoGraph } from "./build.js";

export { ANALYSIS_VERSION, buildRepoGraph, legacyM3 } from "./build.js";

/** Fetch (tarball) + build in one call. */
export const analyzeRepoGraph = async (repoMeta: RepoMeta): Promise<RepoGraph> => {
  const fetched = await fetchRepoFiles(repoMeta);
  return buildRepoGraph(fetched.files, { truncated: fetched.truncated, truncatedReason: fetched.truncatedReason });
};

import axios, { isCancel } from 'axios';
import { API_URL } from '../../../shared/api/config';

// Base URL: uses configured API_URL or falls back to local backend port
const API_BASE_URL = API_URL || 'http://localhost:5000';

export const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export { isCancel };

export interface AnalyzeRepoParams {
  repoUrl?: string;
  repoURL?: string;
}

export interface RawAnalysisData {
  m1?: Array<{ path: string; purpose: string; type: string }>;
  m2?: { file: string; executionFlow?: string[]; description?: string } | null;
  m3?: {
    files?: Record<string, any>;
    edges?: Array<{ source: string; target: string; typeOnly?: boolean }>;
    cycles?: string[][];
    orphans?: string[];
    layerFlow?: Array<{ from: string; to: string; count: number }>;
    stats?: {
      files: number;
      parsed: number;
      edges: number;
      unresolved: number;
      truncated: boolean;
      truncatedReason: string | null;
      unsupportedLanguages: string[];
    };
  };
  architecture?: any;
}

export interface AnalyzeRepoResponse {
  success: boolean;
  cached?: boolean;
  message?: string;
  data: RawAnalysisData;
  analysisId?: string;
  warnings?: string[];
  errors?: string[];
}

export interface AnalysisRequestOptions {
  signal?: AbortSignal;
}

/**
 * Sends a repository analysis request to the backend.
 * Conforms to backend contract: body contains { repoUrl: string }.
 * Supports abort signals to cancel superseded requests.
 */
export const analysisApi = async (
  params: AnalyzeRepoParams | string,
  options?: AnalysisRequestOptions
): Promise<AnalyzeRepoResponse> => {
  const targetUrl = (typeof params === 'string' ? params : (params.repoUrl || params.repoURL || '')).trim();
  const response = await apiInstance.post<AnalyzeRepoResponse>(
    '/api/analysis',
    { repoUrl: targetUrl },
    { signal: options?.signal }
  );
  return response.data;
};

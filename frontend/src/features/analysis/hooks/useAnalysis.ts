import { useCallback } from 'react';
import { useAnalysisContext, transformReal } from '../context/AnalysisContext';
import { analysisApi, isCancel } from '../services/analysis.api';
import { UNAUTHORIZED_EVENT } from '../../../shared/api/config';

/**
 * Custom hook to orchestrate the repository analysis workflow.
 * Coordinates between the API service and the shared AnalysisContext.
 * Guarantees that only the latest active request commits data or updates loading state,
 * and automatically aborts in-flight calls when superseded or when sessions change.
 */
export const useAnalysis = () => {
  const {
    repoUrl,
    setRepoUrl,
    analysisData,
    setAnalysisData,
    isLoading,
    setIsLoading,
    error,
    setError,
    resetAnalysis,
    activeRequestIdRef,
    abortControllerRef,
    currentUserId,
  } = useAnalysisContext();

  const analyzeRepo = useCallback(
    async (url: string): Promise<boolean> => {
      // 1. Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 2. Setup new abort controller and increment shared request ID
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++activeRequestIdRef.current;
      const requestUserId = currentUserId;
      const cleanUrl = url.trim();

      // 3. Initiate loading state & clear prior errors
      setIsLoading(true);
      setError(null);
      setRepoUrl(cleanUrl);

      try {
        // 4. Call the API service with cancellation signal
        const response = await analysisApi({ repoUrl: cleanUrl }, { signal: controller.signal });

        // Guard: check if superseded by a newer request or if session identity changed
        if (activeRequestIdRef.current !== requestId || currentUserId !== requestUserId) {
          return false;
        }

        // Validate backend response contract
        if (!response || !response.success || !response.data) {
          const failureMessage =
            response?.message ||
            (response?.errors && response.errors.length > 0 ? response.errors.join(' | ') : 'Analysis failed');
          setError(failureMessage);
          return false;
        }

        // 5. On success, transform and commit the returned data to shared state
        const transformedData = transformReal(response.data, cleanUrl);
        setAnalysisData(transformedData);
        return true;
      } catch (err: any) {
        // If aborted/cancelled, silently ignore (superseded or session changed)
        if (isCancel(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return false;
        }

        // Guard: check if superseded by a newer request or if session identity changed
        if (activeRequestIdRef.current !== requestId || currentUserId !== requestUserId) {
          return false;
        }

        // Handle 401 Unauthorized
        if (err?.response?.status === 401) {
          window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
          setError('Your session has expired. Please log in again.');
          return false;
        }

        const errorMessage =
          err?.response?.data?.message ||
          (err?.response?.data?.errors && Array.isArray(err.response.data.errors)
            ? err.response.data.errors.join(' | ')
            : null) ||
          err?.message ||
          'Could not reach the analysis backend.';

        setError(errorMessage);
        return false;
      } finally {
        // 6. Only the latest active request is allowed to reset the loading state
        if (activeRequestIdRef.current === requestId) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [
      abortControllerRef,
      activeRequestIdRef,
      currentUserId,
      setIsLoading,
      setError,
      setRepoUrl,
      setAnalysisData,
    ]
  );

  return {
    repoUrl,
    setRepoUrl,
    analysisData,
    setAnalysisData,
    isLoading,
    setIsLoading,
    error,
    setError,
    analyzeRepo,
    resetAnalysis,
  };
};

export default useAnalysis;

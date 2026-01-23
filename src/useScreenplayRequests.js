import { useState, useCallback } from 'react';

/**
 * Hook to manage screenplay generation requests per model
 * Allows canceling requests individually or all at once
 */
export const useScreenplayRequests = () => {
  // Track AbortController for each model
  const [requestControllers, setRequestControllers] = useState({});
  // Track request status per model
  const [requestStates, setRequestStates] = useState({});

  /**
   * Register a new request for a model
   * @param {string} model - Model name/slug
   * @returns {AbortSignal} - Signal to pass to fetch
   */
  const registerRequest = useCallback((model) => {
    const controller = new AbortController();
    
    setRequestControllers(prev => ({
      ...prev,
      [model]: controller
    }));
    
    setRequestStates(prev => ({
      ...prev,
      [model]: {
        status: 'pending',
        startTime: Date.now(),
        error: null,
        cancelled: false
      }
    }));
    
    return controller.signal;
  }, []);

  /**
   * Mark a request as complete
   * @param {string} model - Model name/slug
   * @param {boolean} success - Whether generation succeeded
   * @param {string} error - Error message if failed
   */
  const completeRequest = useCallback((model, success = true, error = null) => {
    setRequestStates(prev => ({
      ...prev,
      [model]: {
        ...prev[model],
        status: success ? 'completed' : 'failed',
        error,
        endTime: Date.now(),
        duration: Date.now() - (prev[model]?.startTime || Date.now())
      }
    }));
    
    // Clean up the controller
    setRequestControllers(prev => {
      const updated = { ...prev };
      delete updated[model];
      return updated;
    });
  }, []);

  /**
   * Cancel a specific model's request
   * @param {string} model - Model name/slug
   */
  const cancelRequest = useCallback((model) => {
    console.log(`[useScreenplayRequests] Attempting to cancel request for model: ${model}`);
    console.log(`[useScreenplayRequests] Available controllers:`, Object.keys(requestControllers));
    const controller = requestControllers[model];
    if (controller) {
      console.log(`[useScreenplayRequests] Found controller, aborting...`);
      controller.abort();
      
      setRequestStates(prev => ({
        ...prev,
        [model]: {
          ...prev[model],
          status: 'cancelled',
          cancelled: true,
          endTime: Date.now(),
          duration: Date.now() - (prev[model]?.startTime || Date.now())
        }
      }));
      
      setRequestControllers(prev => {
        const updated = { ...prev };
        delete updated[model];
        return updated;
      });
    } else {
      console.log(`[useScreenplayRequests] No controller found for model: ${model}`);
    }
  }, [requestControllers]);

  /**
   * Cancel all active requests
   */
  const cancelAllRequests = useCallback(() => {
    Object.entries(requestControllers).forEach(([model, controller]) => {
      controller.abort();
    });
    
    setRequestStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(model => {
        if (updated[model]?.status === 'pending') {
          updated[model] = {
            ...updated[model],
            status: 'cancelled',
            cancelled: true,
            endTime: Date.now(),
            duration: Date.now() - (updated[model]?.startTime || Date.now())
          };
        }
      });
      return updated;
    });
    
    setRequestControllers({});
  }, [requestControllers]);

  /**
   * Get all active models currently generating
   * @returns {string[]} - Array of model names
   */
  const getActiveModels = useCallback(() => {
    return Object.keys(requestControllers);
  }, [requestControllers]);

  /**
   * Check if any requests are active
   * @returns {boolean}
   */
  const hasActiveRequests = useCallback(() => {
    return Object.keys(requestControllers).length > 0;
  }, [requestControllers]);

  /**
   * Clear request history (doesn't cancel active requests)
   */
  const clearRequestHistory = useCallback(() => {
    setRequestStates({});
  }, []);

  /**
   * Get status of a specific model
   * @param {string} model - Model name/slug
   * @returns {object} - Request state for the model
   */
  const getRequestStatus = useCallback((model) => {
    return requestStates[model] || null;
  }, [requestStates]);

  return {
    registerRequest,
    completeRequest,
    cancelRequest,
    cancelAllRequests,
    getActiveModels,
    hasActiveRequests,
    clearRequestHistory,
    getRequestStatus,
    requestStates,
    activeModels: Object.keys(requestControllers)
  };
};

import { useState, useCallback, useEffect } from 'react';
import { store, registerRequest as registerRequestAction, completeRequest as completeRequestAction, cancelRequest as cancelRequestAction, clearRequests as clearRequestsAction, RequestState } from './store/index';

/**
 * Hook to manage screenplay generation requests per model
 * Allows canceling requests individually or all at once
 */
export const useScreenplayRequests = () => {
  // Track AbortController for each model (still local since AbortController can't be serialized)
  const [requestControllers, setRequestControllers] = useState<Record<string, AbortController>>({});
  
  // Force re-render when store changes
  const [, forceUpdate] = useState(0);
  
  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate(prev => prev + 1);
    });
    
    return unsubscribe;
  }, []);
  
  // Get request states directly from store (create a new reference to trigger re-renders)
  const requestStates = { ...store.getState().requests };

  /**
   * Register a new request for a model
   * @param {string} model - Model name/slug
   * @returns {AbortSignal} - Signal to pass to fetch
   */
  const registerRequest = useCallback((model: string): AbortSignal => {
    const controller = new AbortController();
    
    setRequestControllers(prev => ({
      ...prev,
      [model]: controller
    }));
    
    // Dispatch to Redux store
    store.dispatch(registerRequestAction(model));
    
    return controller.signal;
  }, []);

  /**
   * Mark a request as complete
   * @param {string} model - Model name/slug
   * @param {boolean} success - Whether generation succeeded
   * @param {string} error - Error message if failed
   */
  const completeRequest = useCallback((model: string, success: boolean = true, error: string | null = null) => {
    // Dispatch to Redux store
    store.dispatch(completeRequestAction(model, success, error));
    
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
  const cancelRequest = useCallback((model: string) => {
    console.log(`[useScreenplayRequests] Attempting to cancel request for model: ${model}`);
    console.log(`[useScreenplayRequests] Available controllers:`, Object.keys(requestControllers));
    const controller = requestControllers[model];
    if (controller) {
      console.log(`[useScreenplayRequests] Found controller, aborting...`);
      controller.abort();
      
      // Dispatch to Redux store
      store.dispatch(cancelRequestAction(model));
      
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
      // Dispatch cancel action for each model
      store.dispatch(cancelRequestAction(model));
    });
    
    setRequestControllers({});
  }, [requestControllers]);

  /**
   * Get all active models currently generating
   * @returns {string[]} - Array of model names
   */
  const getActiveModels = useCallback((): string[] => {
    return Object.keys(requestControllers);
  }, [requestControllers]);

  /**
   * Check if any requests are active
   * @returns {boolean}
   */
  const hasActiveRequests = useCallback((): boolean => {
    return Object.keys(requestControllers).length > 0;
  }, [requestControllers]);

  /**
   * Clear request history (doesn't cancel active requests)
   */
  const clearRequestHistory = useCallback(() => {
    store.dispatch(clearRequestsAction());
  }, []);

  /**
   * Get status of a specific model
   * @param {string} model - Model name/slug
   * @returns {object} - Request state for the model
   */
  const getRequestStatus = useCallback((model: string): RequestState | null => {
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

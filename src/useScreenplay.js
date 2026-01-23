import { useState, useEffect, useCallback } from 'react';
import { useScreenplayRequests } from './useScreenplayRequests';

export const useScreenplay = () => {
  const [screenplay, setScreenplay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedModels, setSelectedModels] = useState([]);
  const [multiModelResults, setMultiModelResults] = useState({});
  
  // Request management per model
  const {
    registerRequest,
    completeRequest,
    cancelRequest,
    cancelAllRequests,
    getActiveModels,
    hasActiveRequests,
    clearRequestHistory,
    requestStates,
    activeModels
  } = useScreenplayRequests();

  // detect debug flag from URL (search or hash), evaluated at request time
  function getIsDebug() {
    if (typeof window === 'undefined') return false;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('debug') === 'true') return true;

      // Handle hash variants: '#debug=true' or '#/path?debug=true'
      const hash = window.location.hash || '';
      if (hash.includes('debug=true')) return true;

      // Also check if hash contains query-like part (after '?')
      const hashQueryIndex = hash.indexOf('?');
      if (hashQueryIndex !== -1) {
        const hashQuery = new URLSearchParams(hash.slice(hashQueryIndex + 1));
        if (hashQuery.get('debug') === 'true') return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  useEffect(() => {
    const url = getIsDebug() ? '/api/screenplay/format?debug=true' : '/api/screenplay/format';
    fetch(url)
      .then(res => res.json())
      .then(data => setFormat(data))
      .catch(err => console.error('Failed to load format:', err));
  }, []);

  // Fetch available free models on init and extract model slugs from models.json
  useEffect(() => {
    const modelsUrl = '/api/models';
    fetch(modelsUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Models API response:', data);
        
        // Extract slugs from data.models array
        let items = [];
        if (data.data && Array.isArray(data.data.models)) {
          // OpenRouter format: { data: { models: [...] } }
          items = data.data.models;
        } else if (Array.isArray(data.rows)) {
          // Alternative format: { rows: [...] }
          items = data.rows;
        } else if (Array.isArray(data.models)) {
          // Alternative format: { models: [...] }
          items = data.models;
        } else if (Array.isArray(data)) {
          // Direct array format
          items = data;
        }

        console.log('Extracted items:', items);
        
        if (Array.isArray(items) && items.length > 0) {
          // Extract model_variant_slug from endpoint
          const slugs = items
            .map(item => {
              // Get model_variant_slug from endpoint (includes :free suffix where appropriate)
              if (item.endpoint?.model_variant_slug) {
                return item.endpoint.model_variant_slug;
              }
              return null;
            })
            .filter(Boolean);

          console.log('Extracted slugs:', slugs);
          const unique = Array.from(new Set(slugs));
          console.log('Unique slugs:', unique);
          setModels(unique);
          // Set first model as default
          if (unique.length) setSelectedModel(unique[0]);
        } else {
          console.warn('No items found in models response');
        }
      })
      .catch(err => console.warn('Failed to fetch models list:', err));
  }, []);

  const generate = async (story_pitch, dialog_languages, default_screenplay_language, min_lines_per_dialog, model, customApiKey) => {
    setLoading(true);
    setError('');
    try {
      const isDebug = getIsDebug();
      const url = isDebug ? '/api/screenplay/generate?debug=true' : '/api/screenplay/generate';
      const payload = {
        story_pitch: story_pitch || '',
        dialog_languages,
        default_screenplay_language,
        min_lines_per_dialog,
        model: model || selectedModel,
        ...(customApiKey && { customApiKey }),
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // If request failed, attempt to include full request + response details when debug is enabled
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let bodyText = null;
        try {
          bodyText = contentType.includes('application/json') ? JSON.stringify(await res.json(), null, 2) : await res.text();
        } catch (e) {
          bodyText = await res.text().catch(() => null);
        }

        const requestInfo = `REQUEST:\n${'─'.repeat(60)}\nMethod: POST\nURL: ${url}\nHeaders: Content-Type: application/json\nBody:\n${JSON.stringify(payload, null, 2)}`;
        const responseInfo = `\n\nRESPONSE:\n${'─'.repeat(60)}\nStatus: ${res.status} ${res.statusText}\nHeaders:\n${Array.from(res.headers.entries()).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\nBody:\n${bodyText}`;

        const msg = isDebug ? `${requestInfo}${responseInfo}` : 'Generation failed';

        throw new Error(msg);
      }

      const data = await res.json();
      setScreenplay(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateForMultipleModels = async (story_pitch, dialog_languages, default_screenplay_language, min_lines_per_dialog, modelsToGenerate, customApiKey, onModelComplete) => {
    setLoading(true);
    setError('');
    setMultiModelResults({});
    
    try {
      const results = {};
      const promises = modelsToGenerate.map(async (model) => {
        try {
          // Register request for this model
          const signal = registerRequest(model);
          
          const response = await fetch('/api/screenplay/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              story_pitch,
              dialog_languages,
              default_screenplay_language,
              min_lines_per_dialog,
              model,
              customApiKey,
            }),
            signal, // Pass abort signal for this model
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          results[model] = { success: true, data, completedAt: new Date().toISOString() };
          
          // Mark request as complete
          completeRequest(model, true);
          
          // Callback when a model completes (for immediate history update)
          if (onModelComplete) {
            onModelComplete(model, data);
          }
        } catch (err) {
          // Check if error was due to abort
          const isAborted = err.name === 'AbortError';
          results[model] = { 
            success: false, 
            error: err.message,
            cancelled: isAborted,
            completedAt: new Date().toISOString()
          };
          
          // Mark request as complete
          completeRequest(model, false, err.message);
        }
      });

      await Promise.all(promises);
      setMultiModelResults(results);
      
      // Set the first successful result as the main screenplay
      const firstSuccess = Object.entries(results).find(([_, result]) => result.success);
      if (firstSuccess) {
        setScreenplay(firstSuccess[1].data);
      }
      
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    screenplay, 
    loading, 
    error, 
    generate, 
    format, 
    models, 
    selectedModel, 
    setSelectedModel, 
    selectedModels, 
    setSelectedModels, 
    multiModelResults, 
    generateForMultipleModels,
    // Per-model request management
    cancelRequest,
    cancelAllRequests,
    clearRequestHistory,
    requestStates,
    activeModels
  };
};

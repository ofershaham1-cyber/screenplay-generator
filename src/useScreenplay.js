import { useState, useEffect } from 'react';

export const useScreenplay = () => {
  const [screenplay, setScreenplay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

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

  // Fetch available free models on init and extract model_variant_slug
  useEffect(() => {
    const modelsUrl = '/api/models';
    fetch(modelsUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Models API response:', data);
        // Expect data.rows or data.items depending on API
        const items = data.rows || data.items || data.models || data;
        console.log('Extracted items:', items);
        if (Array.isArray(items)) {
          // extract unique model_variant_slug values
          const variants = items
            .map(i => i.model_variant_slug || i.model_variant || i.slug)
            .filter(Boolean);
          console.log('Extracted variants:', variants);
          const unique = Array.from(new Set(variants));
          console.log('Unique variants:', unique);
          setModels(unique);
          if (unique.length && !selectedModel) setSelectedModel(unique[0]);
        } else {
          console.warn('Items is not an array:', items);
        }
      })
      .catch(err => console.warn('Failed to fetch models list:', err));
  }, [selectedModel]);

  const generate = async (story_pitch, languages_used, default_screenplay_language, model) => {
    setLoading(true);
    setError('');
    try {
      const isDebug = getIsDebug();
      const url = isDebug ? '/api/screenplay/generate?debug=true' : '/api/screenplay/generate';
      const payload = {
        story_pitch: story_pitch || '',
        languages_used,
        default_screenplay_language,
        debug: isDebug,
        model: model || selectedModel,
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

        const requestInfo = `Request:\nMethod: POST\nURL: ${url}\nHeaders: ${JSON.stringify({ 'Content-Type': 'application/json' }, null, 2)}\nBody: ${JSON.stringify(payload, null, 2)}`;
        const responseInfo = `Response:\nStatus: ${res.status} ${res.statusText}\nHeaders: ${JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2)}\nBody: ${bodyText}`;

        const msg = isDebug ? `${requestInfo}\n\n${responseInfo}` : 'Generation failed';

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

  return { screenplay, loading, error, generate, format, models, selectedModel, setSelectedModel };
};

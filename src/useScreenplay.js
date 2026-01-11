import { useState, useEffect } from 'react';

export const useScreenplay = () => {
  const [screenplay, setScreenplay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState(null);

  useEffect(() => {
    fetch('/screenplay/format')
      .then(res => res.json())
      .then(data => setFormat(data))
      .catch(err => console.error('Failed to load format:', err));
  }, []);

  const generate = async (story_pitch, languages_used, default_screenplay_language) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/screenplay/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_pitch: story_pitch || '',
          languages_used,
          default_screenplay_language
        })
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setScreenplay(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { screenplay, loading, error, generate, format };
};

import { useState, useEffect } from 'react';
import { useScreenplay } from './useScreenplay';
import './ScreenplayGenerator.css';

const LANGUAGES = ['English', 'Hebrew', 'Spanish', 'French', 'Russian', 'Chinese', 'Japanese', 'Arabic', 'German', 'Italian', 'Portuguese', 'Korean', 'Dutch', 'Polish', 'Turkish', 'Hindi'];

export default function ScreenplayGenerator({ onScreenplayGenerated, generatingScreenplay, onGenerationStart, onGenerationEnd }) {
  const [storypitch, setStorypitch] = useState(
           'Create a conversation between an adult and a child playing a guessing game'
);
  const [languagesUsed, setLanguagesUsed] = useState(['Arabic', 'Hebrew']);
  const [defaultScreenplayLanguage, setDefaultScreenplayLanguage] = useState('Hebrew');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // API key override (model must come from dropdown)
  const [overrideApiKey, setOverrideApiKey] = useState('');

  const { screenplay, loading, error, generate, models, selectedModel, setSelectedModel } = useScreenplay();

  // Save screenplay to history when generated
  useEffect(() => {
    if (screenplay && onScreenplayGenerated) {
      onScreenplayGenerated(screenplay, {
        story_pitch: storypitch,
        dialog_languages: languagesUsed,
        default_screenplay_language: defaultScreenplayLanguage,
        model: selectedModel,
      });
    }
  }, [screenplay]);

  const handleGenerate = () => {
    // Always use dropdown model, only allow API key override
    const apiKey = overrideApiKey || null;
    
    onGenerationStart();
    generate(storypitch, languagesUsed, defaultScreenplayLanguage, selectedModel, apiKey);
  };

  // Update App when generation completes
  useEffect(() => {
    if (!loading && screenplay) {
      onGenerationEnd();
    }
  }, [loading, screenplay]);

  const toggleLanguage = (lang) => {
    setLanguagesUsed(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="container">
      <div className="section">
        <div className="header">
          <h2>Generate Screenplay</h2>
        </div>
        <div className="form-group">
          <label>Story pitch (optional)</label>
          <textarea
            placeholder="Enter your story pitch..."
            value={storypitch}
            onChange={(e) => setStorypitch(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Languages Used (for character dialog)</label>
          <div className="lang-grid">
            {LANGUAGES.map(lang => (
              <label key={lang} className="lang-option">
                <input
                  type="checkbox"
                  checked={languagesUsed.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                  disabled={loading}
                />
                {lang}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Default Screenplay Language (for all text except the dialogs)</label>
          <select
            value={defaultScreenplayLanguage}
            onChange={(e) => setDefaultScreenplayLanguage(e.target.value)}
            disabled={loading}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Model</label>
          <select
            value={selectedModel || ''}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading || !models || models.length === 0}
          >
            {models && models.length ? (
              models.map(m => <option key={m} value={m}>{m}</option>)
            ) : (
              <option value="">Default</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label 
            style={{ cursor: 'pointer', color: '#0066cc' }}
            onClick={() => setShowApiKey(!showApiKey)}
            title="Click to toggle API key input"
          >
            {showApiKey ? '▼' : '▶'} Custom API Key (optional)
          </label>
          {showApiKey && (
            <input
              type="password"
              placeholder="sk-or-v1-... (leave empty to use default)"
              value={overrideApiKey}
              onChange={(e) => setOverrideApiKey(e.target.value)}
              disabled={loading}
            />
          )}
        </div>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Screenplay'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

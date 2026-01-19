import { useState, useEffect } from 'react';
import { useScreenplay } from './useScreenplay';
import ScreenplayView from './ScreenplayView';
import './ScreenplayGenerator.css';

const LANGUAGES = ['English', 'Hebrew', 'Spanish', 'French', 'Russian', 'Chinese', 'Japanese', 'Arabic', 'German', 'Italian', 'Portuguese', 'Korean', 'Dutch', 'Polish', 'Turkish', 'Hindi'];

export default function ScreenplayGenerator({ onScreenplayGenerated, generatingScreenplay, onGenerationStart, onGenerationEnd }) {
  const [storypitch, setStorypitch] = useState(
           'Create a conversation between an adult and a child playing a guessing game'
);
  const [languagesUsed, setLanguagesUsed] = useState(['Arabic', 'Hebrew']);
  const [defaultScreenplayLanguage, setDefaultScreenplayLanguage] = useState('Hebrew');
  const [showFormat, setShowFormat] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // API key override (model must come from dropdown)
  const [overrideApiKey, setOverrideApiKey] = useState('');
  
  const { screenplay, loading, error, generate, format, models, selectedModel, setSelectedModel } = useScreenplay();

  // Initialize dark mode from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    const darkParam = params.get('dark') === 'true';
    setDarkMode(darkParam);
  }, []);

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
    
    generate(storypitch, languagesUsed, defaultScreenplayLanguage, selectedModel, apiKey);
  };

  const toggleLanguage = (lang) => {
    setLanguagesUsed(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // Use persisted screenplay if available, otherwise use new generation
  const displayScreenplay = screenplay || generatingScreenplay;

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
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
          <label>Custom API Key (optional)</label>
          <input
            type="password"
            placeholder="sk-or-v1-... (leave empty to use default)"
            value={overrideApiKey}
            onChange={(e) => setOverrideApiKey(e.target.value)}
            disabled={loading}
          />
        </div>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Screenplay'}
        </button>
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            Generating screenplay...
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      {displayScreenplay && (
        <ScreenplayView
          screenplay={displayScreenplay}
          format={format}
          darkMode={darkMode}
          showFormat={showFormat}
          onShowFormatChange={setShowFormat}
        />
      )}
    </div>
  );
}

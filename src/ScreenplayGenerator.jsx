import { useState, useEffect } from 'react';
import { useScreenplay } from './useScreenplay';
import { LANGUAGES } from './config/languages';
import './ScreenplayGenerator.css';

export default function ScreenplayGenerator({ 
  onScreenplayGenerated, 
  generatingScreenplay, 
  onGenerationStart, 
  onGenerationEnd,
  storypitch,
  setStorypitch,
  languagesUsed,
  setLanguagesUsed,
  defaultScreenplayLanguage,
  setDefaultScreenplayLanguage,
  useMultipleModels,
  setUseMultipleModels,
  overrideApiKey,
  setOverrideApiKey,
  selectedModels,
  setSelectedModels
}) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasUserCleared, setHasUserCleared] = useState(false);
  
  const { screenplay, loading, error, generate, generateForMultipleModels, models, selectedModel, setSelectedModel, multiModelResults } = useScreenplay();

  // Initialize selectedModels with all models when models are loaded (only once)
  useEffect(() => {
    if (models && models.length > 0 && selectedModels.length === 0 && !hasUserCleared) {
      setSelectedModels(models);
    }
  }, [models, selectedModels.length, setSelectedModels, hasUserCleared]);

  // Save screenplay to history and update App when generation completes
  useEffect(() => {
    if (screenplay && onScreenplayGenerated) {
      onScreenplayGenerated(screenplay, {
        story_pitch: storypitch,
        dialog_languages: languagesUsed,
        default_screenplay_language: defaultScreenplayLanguage,
        model: selectedModel,
        models: useMultipleModels ? selectedModels : [selectedModel],
      });
      onGenerationEnd();
    }
  }, [screenplay]);

  const handleGenerate = () => {
    const apiKey = overrideApiKey || null;
    
    onGenerationStart();
    
    if (useMultipleModels && selectedModels.length > 0) {
      // Set selectedModel to the first model for history tracking
      setSelectedModel(selectedModels[0]);
      
      // Callback when each model completes - saves individual model results to history
      const onModelComplete = (model, data) => {
        if (onScreenplayGenerated) {
          onScreenplayGenerated(data, {
            story_pitch: storypitch,
            dialog_languages: languagesUsed,
            default_screenplay_language: defaultScreenplayLanguage,
            model: model,
            models: selectedModels,
            multiModel: true,
            generatedAt: new Date().toISOString()
          });
        }
      };
      
      generateForMultipleModels(storypitch, languagesUsed, defaultScreenplayLanguage, selectedModels, apiKey, onModelComplete);
    } else {
      generate(storypitch, languagesUsed, defaultScreenplayLanguage, selectedModel, apiKey);
    }
  };

  const toggleModelSelection = (model) => {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const selectAllModels = () => {
    setSelectedModels([...models]);
    setHasUserCleared(false);
  };

  const clearAllModels = () => {
    console.log('Clearing all models, current:', selectedModels);
    setSelectedModels([]);
    setHasUserCleared(true);
  };

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
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={useMultipleModels}
              onChange={(e) => setUseMultipleModels(e.target.checked)}
              disabled={loading}
            />
            Generate for Multiple Models
          </label>
          
          {useMultipleModels ? (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button type="button" onClick={selectAllModels} disabled={loading || !models || models.length === 0}>
                  Select All
                </button>
                <button type="button" onClick={clearAllModels} disabled={loading}>
                  Clear All
                </button>
              </div>
              <div className="lang-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {models && models.length ? (
                  models.map(model => (
                    <label key={model} className="lang-option">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model)}
                        onChange={() => toggleModelSelection(model)}
                        disabled={loading}
                      />
                      {model}
                    </label>
                  ))
                ) : (
                  <p style={{ color: '#666' }}>Loading models...</p>
                )}
              </div>
              {selectedModels.length > 0 && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {selectedModels.length} model(s) selected
                </p>
              )}
            </>
          ) : (
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
          )}
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
        
        {loading && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#e3f2fd',
            borderLeft: '3px solid #0066cc',
            borderRadius: '3px',
            fontSize: '13px',
            color: '#0066cc'
          }}>
            <strong>💡 Tip:</strong> Visit the <a href="#/ongoing" style={{ color: '#0066cc', fontWeight: '500' }}>Ongoing Requests</a> page to monitor generation progress and cancel individual models.
          </div>
        )}
        
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { LANGUAGES } from './config/languages';
import './ScreenplayPreferences.css';

export default function ScreenplayPreferences({ theme = 'light', design = 'standard' }) {
  const [languageSpeeds, setLanguageSpeeds] = useState({});
  const [defaultSpeed, setDefaultSpeed] = useState(1);
  const [saved, setSaved] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('screenplay-tts-preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setLanguageSpeeds(prefs.languageSpeeds || {});
        setDefaultSpeed(prefs.defaultSpeed || 1);
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = () => {
    const prefs = {
      languageSpeeds,
      defaultSpeed,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('screenplay-tts-preferences', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLanguageSpeed = (lang, speed) => {
    const numSpeed = parseFloat(speed);
    // Limit to max 1.0
    const clampedSpeed = Math.min(numSpeed, 1.0);
    setLanguageSpeeds(prev => ({
      ...prev,
      [lang]: clampedSpeed
    }));
  };

  const updateDefaultSpeed = (speed) => {
    const numSpeed = parseFloat(speed);
    // Limit to max 1.0
    const clampedSpeed = Math.min(numSpeed, 1.0);
    setDefaultSpeed(clampedSpeed);
  };

  const resetToDefaults = () => {
    const defaultSpeeds = {};
    LANGUAGES.forEach(lang => {
      defaultSpeeds[lang] = 1;
    });
    setLanguageSpeeds(defaultSpeeds);
    setDefaultSpeed(1);
  };

  return (
    <div className={`container theme-${theme} design-${design}`}>
      <div className="section">
        <div className="header">
          <h2>⚙️ TTS Preferences</h2>
        </div>
        
        <div className="form-group">
          <label>Language Speed Controls</label>
          <div className="speed-controls-container">
            {/* Default Speed */}
            <div className="default-speed-section">
              <label className="subsection-label">Default Speed (for all languages)</label>
              <div className="speed-control">
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.1"
                  value={defaultSpeed}
                  onChange={(e) => updateDefaultSpeed(e.target.value)}
                  className="speed-slider"
                />
                <span className="speed-value">{defaultSpeed.toFixed(1)}x</span>
              </div>
            </div>

            {/* Language-Specific Speeds */}
            <div className="language-speeds-section">
              <label className="subsection-label">Speech Speed by Language</label>
              <div className="speed-grid">
                {LANGUAGES.map(lang => (
                  <div key={lang} className="speed-item">
                    <label className="speed-label">{lang}</label>
                    <div className="speed-control">
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.1"
                        value={languageSpeeds[lang] || defaultSpeed}
                        onChange={(e) => updateLanguageSpeed(lang, e.target.value)}
                        className="speed-slider"
                      />
                      <span className="speed-value">
                        {(languageSpeeds[lang] || defaultSpeed).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <small className="help-text">
            Default speed applies to all languages unless overridden. Maximum speed: 1.0x (limited for better clarity)
          </small>
        </div>

        <div className="button-group">
          <button onClick={savePreferences} className="save-btn">
            💾 Save Preferences
          </button>
          <button onClick={resetToDefaults} className="reset-btn">
            🔄 Reset to Defaults
          </button>
        </div>

        {saved && (
          <div className="success-message">
            ✓ Preferences saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { LANGUAGES } from './config/languages';

export default function LanguageSpeedControls({ 
  languageSpeeds, 
  onLanguageSpeedChange, 
  defaultSpeed,
  title = "Language-Specific Speeds"
}) {
  return (
    <div className="form-group">
      <label>{title}</label>
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
                onChange={(e) => onLanguageSpeedChange(lang, e.target.value)}
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
  );
}

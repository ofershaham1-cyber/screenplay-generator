import { useState, useEffect } from 'react';
import { playScreenplay, stop, setDynamicLanguageSpeeds } from './tts';
import './ScreenplayPlayer.css';

const LANGUAGE_COLORS = {
  'English': '#8b5cf6', // purple
  'Hebrew': '#3b82f6',  // blue
  'Spanish': '#10b981', // emerald
  'French': '#f59e0b',  // amber
  'Russian': '#ef4444', // red
  'Chinese': '#ec4899', // pink
  'Japanese': '#06b6d4', // cyan
  'Arabic': '#84cc16',  // lime
  'German': '#f97316',  // orange
  'Italian': '#6366f1', // indigo
  'Portuguese': '#14b8a6', // teal
  'Korean': '#8b5a2b', // brown
  'Dutch': '#64748b',   // slate
  'Polish': '#7c3aed',  // violet
  'Turkish': '#dc2626', // rose
  'Hindi': '#059669'    // green
};

const RTL_LANGUAGES = ['Arabic', 'Hebrew', 'Urdu', 'Persian', 'Farsi', 'Pashto', 'Kurdish'];

const isLanguageRTL = (lang) => RTL_LANGUAGES.includes(lang);

export default function ScreenplayView({ screenplay, format, darkMode = false, showFormat = false, onShowFormatChange }) {
  const [playing, setPlaying] = useState(false);
  const [narrator, setNarrator] = useState(false);
  const [characterLang, setCharacterLang] = useState(true);
  const [currentScene, setCurrentScene] = useState(-1);
  const [currentLine, setCurrentLine] = useState(-1);
  const [expandedSections, setExpandedSections] = useState({});
  const [languageSpeeds, setLanguageSpeeds] = useState({});
  const [currentWord, setCurrentWord] = useState('');

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePlay = async () => {
    if (!screenplay) return;
    setPlaying(true);
    setCurrentScene(-1);
    setCurrentLine(-1);
    await playScreenplay(screenplay, {
      includeNarrator: narrator,
      characterMode: characterLang,
      languageSpeeds: { ...languageSpeeds },
      onLineStart: (sceneIdx, lineIdx) => {
        setCurrentScene(sceneIdx);
        setCurrentLine(lineIdx);
      },
      onWordStart: (word) => {
        setCurrentWord(word || '');
      }
    });
    setPlaying(false);
  };

  const handleStop = () => {
    stop();
    setPlaying(false);
  };

  const updateLanguageSpeed = (lang, speed) => {
    setLanguageSpeeds(prev => {
      const updated = { ...prev, [lang]: speed };
      // Update dynamic speeds in real-time if playing
      if (playing) {
        setDynamicLanguageSpeeds(updated);
      }
      return updated;
    });
  };

  const expandAll = () => {
    const allSections = {};
    const collectKeys = (obj, prefix = '') => {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          const key = prefix ? `${prefix}.${k}` : k;
          if (typeof v === 'object') {
            allSections[key] = true;
            collectKeys(v, key);
          }
        });
      }
    };
    if (format) collectKeys(format, 'format');
    if (screenplay) collectKeys(screenplay, 'screenplay');
    setExpandedSections(allSections);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const renderValue = (value, key = '') => {
    if (value === null || value === undefined) return <span className="null-value">null</span>;

    if (Array.isArray(value)) {
      const isExpanded = expandedSections[key];
      return (
        <div className="json-array">
          <button className="toggle-btn" onClick={() => toggleSection(key)}>
            {isExpanded ? '[-]' : '[+]'} Array ({value.length} items)
          </button>
          {isExpanded && (
            <div className="json-content">
              {value.map((item, idx) => (
                <div key={idx} className="json-item">
                  <strong>[{idx}]:</strong> {renderValue(item, `${key}.${idx}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedSections[key];
      return (
        <div className="json-object">
          <button className="toggle-btn" onClick={() => toggleSection(key)}>
            {isExpanded ? '[-]' : '[+]'} Object ({Object.keys(value).length} keys)
          </button>
          {isExpanded && (
            <div className="json-content">
              {Object.entries(value).map(([k, v]) => (
                <div key={k} className="json-property">
                  <strong>{k}:</strong> {renderValue(v, `${key}.${k}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="json-value">{String(value)}</span>;
  };

  if (!screenplay) {
    return null;
  }

  return (
    <div className="section">
      <h2>Generated Screenplay</h2>

      <div className="language-legend">
        <h3>Language Legend</h3>
        <div className="legend-items">
          {screenplay.dialog_languages?.map(lang => (
            <div key={lang} className="legend-item">
              <div 
                className="color-box" 
                style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#6b7280' }}
              ></div>
              <span>{lang}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="screenplay-preview">
        <h3>Quick Preview</h3>
        <div className="screenplay-info">
          <p><strong>Story Pitch:</strong> {screenplay.story_pitch}</p>
          <p><strong>Exposition:</strong> {screenplay.exposition}</p>
          <p><strong>Languages Used:</strong> {screenplay.dialog_languages?.join(', ')}</p>
          <p><strong>Cast:</strong> {screenplay.cast?.map(c => c.name).join(', ')}</p>
          <p><strong>Scenes:</strong> {screenplay.scenes?.length}</p>
        </div>
      </div>

      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={narrator}
            onChange={(e) => setNarrator(e.target.checked)}
            disabled={playing}
          />
          Narrator Mode
        </label>
        <label>
          <input
            type="checkbox"
            checked={characterLang}
            onChange={(e) => setCharacterLang(e.target.checked)}
            disabled={playing}
          />
          Character Languages
        </label>
      </div>

      <div className="form-group">
        <label>Speech Speed by Language {playing && <span className="live-label">📡 Live</span>}</label>
        <div className="speed-grid">
          {(screenplay?.dialog_languages || []).map(lang => (
            <div key={lang} className="speed-control">
              <label>{lang}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={languageSpeeds[lang] || 1}
                onChange={(e) => updateLanguageSpeed(lang, parseFloat(e.target.value))}
                title={`Speed: ${(languageSpeeds[lang] || 1).toFixed(1)}x`}
                className={playing ? 'active-control' : ''}
              />
              <span className="speed-value">{(languageSpeeds[lang] || 1).toFixed(1)}x</span>
            </div>
          ))}
        </div>
      </div>

      <div className="buttons">
        <button
          onClick={handlePlay}
          disabled={playing || !screenplay}
          className="play"
        >
          {playing ? 'Playing...' : 'Play Screenplay'}
        </button>
        <button onClick={handleStop} disabled={!playing} className="stop">
          Stop
        </button>
      </div>

      <div className="full-screenplay">
        <h2>Complete Screenplay Structure</h2>
        {renderValue(screenplay, 'screenplay')}
      </div>

      <div className={`readable-screenplay ${isLanguageRTL(screenplay.dialog_languages?.[0]) ? 'rtl' : 'ltr'}`}>
        <h2>Readable Format</h2>
        {screenplay.scenes?.map((scene, sceneIdx) => {
          const sceneHasRTL = screenplay.dialog_languages?.some(lang => isLanguageRTL(lang));
          return (
            <div key={sceneIdx} className={`scene ${sceneHasRTL ? 'rtl' : 'ltr'}`}>
              <h3 style={{ direction: sceneHasRTL ? 'rtl' : 'ltr', textAlign: sceneHasRTL ? 'right' : 'left' }}>
                {scene.scene_heading || `Scene ${sceneIdx + 1}`}
              </h3>
              <p className="scene-description" style={{ direction: sceneHasRTL ? 'rtl' : 'ltr', textAlign: sceneHasRTL ? 'right' : 'left' }}>
                {scene.scene}
              </p>
              {scene.transition && (
                <p className="transition" style={{ direction: sceneHasRTL ? 'rtl' : 'ltr', textAlign: sceneHasRTL ? 'right' : 'left' }}>
                  {scene.transition}
                </p>
              )}
              {scene.dialog?.map((line, lineIdx) => {
                const isActive = sceneIdx === currentScene && lineIdx === currentLine;
                const textWithHighlight = isActive && currentWord ? line.text.split(/(\s+)/).map((word, idx) => {
                  const isCurrentWord = word.trim() === currentWord?.trim();
                  return (
                    <span key={idx} className={isCurrentWord ? 'highlighted-word' : ''}>
                      {word}
                    </span>
                  );
                }) : line.text;

                const langColor = LANGUAGE_COLORS[line.language] || '#6b7280';
                const isLineRTL = isLanguageRTL(line.language);

                return (
                  <div
                    key={lineIdx}
                    className={`dialog-line ${isActive ? 'active' : ''} ${isLineRTL ? 'rtl' : 'ltr'}`}
                    style={{ 
                      borderLeft: `4px solid ${langColor}`,
                      direction: isLineRTL ? 'rtl' : 'ltr',
                      textAlign: isLineRTL ? 'right' : 'left'
                    }}
                  >
                    <div className="character" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                      {line.character}
                    </div>
                    {line.parenthetical && (
                      <div className="parenthetical" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                        ({line.parenthetical})
                      </div>
                    )}
                    <div className="line-text" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                      <span className="original">{textWithHighlight}</span>
                    </div>
                    {line.action && (
                      <div className="action" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                        [{line.action}]
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {format && (
        <div className="form-group">
          <h3 onClick={() => onShowFormatChange?.(!showFormat)} style={{ cursor: 'pointer', margin: '0 0 12px 0' }}>
            {showFormat ? '[-]' : '[+]'} Response Format Schema
          </h3>
          {showFormat && (
            <div className="expand-buttons">
              <button onClick={expandAll} className="expand-btn">
                Expand All
              </button>
              <button onClick={collapseAll} className="collapse-btn">
                Collapse All
              </button>
            </div>
          )}
          {showFormat && (
            <div className="format-display">
              {renderValue(format, 'format')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

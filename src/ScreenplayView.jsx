import { useState, useEffect } from 'react';
import { playScreenplay, stop, pause, resume, isPaused, isSpeaking, setDynamicLanguageSpeeds } from './tts';
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
  const [playing, setPlaying] = useState('stopped'); // 'stopped', 'playing', 'paused'
  const [currentScene, setCurrentScene] = useState(-1);
  const [currentLine, setCurrentLine] = useState(-1);
  const [expandedSections, setExpandedSections] = useState({});
  const [languageSpeeds, setLanguageSpeeds] = useState({});
  const [defaultLanguageSpeed, setDefaultLanguageSpeed] = useState(1);
  const [currentWord, setCurrentWord] = useState('');
  const [currentContentType, setCurrentContentType] = useState('');
  const [showTtsOptions, setShowTtsOptions] = useState(false);
  const [ttsOptions, setTtsOptions] = useState({
    includeNarrator: false,
    includeCharacter: true,
    includeText: true,
    includeTranslation: true,
    includeAction: true,
    includeParenthetical: false,
    translationTiming: 'after' // 'before', 'after', 'both'
  });

  const highlightText = (text, contentType, sceneIdx, lineIdx) => {
    if (!text || !currentWord || currentContentType !== contentType) {
      return text;
    }
    
    // For scene content, only check scene index
    if (contentType === 'scene' && currentScene !== sceneIdx) {
      return text;
    }
    
    // For line content, check both scene and line index
    if (contentType !== 'scene' && (currentScene !== sceneIdx || currentLine !== lineIdx)) {
      return text;
    }
    
    return text.split(/(\s+)/).map((word, idx) => {
      const isCurrentWord = word.trim() === currentWord?.trim();
      return (
        <span key={idx} className={isCurrentWord ? 'highlighted-word' : ''}>
          {word}
        </span>
      );
    });
  };

  const [playbackController, setPlaybackController] = useState(null);

  // Monitor speech synthesis state
  useEffect(() => {
    const checkSpeechState = () => {
      if (playing === 'playing' && isPaused()) {
        setPlaying('paused');
      } else if (playing === 'paused' && !isPaused() && isSpeaking()) {
        setPlaying('playing');
      } else if (playing !== 'stopped' && !isSpeaking() && !isPaused()) {
        // Speech ended
        setPlaying('stopped');
        setCurrentScene(-1);
        setCurrentLine(-1);
        setCurrentWord('');
        setCurrentContentType('');
        setPlaybackController(null);
      }
    };

    const interval = setInterval(checkSpeechState, 100);
    return () => clearInterval(interval);
  }, [playing]);

  const handlePlay = async () => {
    if (!screenplay || playing !== 'stopped') return;
    
    setPlaying('playing');
    setCurrentScene(-1);
    setCurrentLine(-1);
    
    // Create a controller to manage playback
    const controller = {
      isCancelled: false,
      pauseRequested: false,
      resumeRequested: false
    };
    setPlaybackController(controller);
    
    try {
      await playScreenplay(screenplay, {
        characterMode: true,
        languageSpeeds: { ...languageSpeeds },
        defaultLanguageSpeed: defaultLanguageSpeed,
        ttsOptions: { ...ttsOptions },
        defaultLanguage: screenplay.default_screenplay_language || 'Hebrew',
        onLineStart: (sceneIdx, lineIdx) => {
          if (!controller.isCancelled) {
            setCurrentScene(sceneIdx);
            setCurrentLine(lineIdx);
          }
        },
        onWordStart: (word, contentType, sceneIdx, lineIdx) => {
          if (!controller.isCancelled) {
            setCurrentWord(word || '');
            setCurrentContentType(contentType);
            setCurrentScene(sceneIdx);
            setCurrentLine(lineIdx);
          }
        },
        controller: controller
      });
      
      // Don't set to stopped here - useEffect will handle it
    } catch (error) {
      console.error('TTS playback error:', error);
      setPlaying('stopped');
      setPlaybackController(null);
    } finally {
      // Only clear controller if not cancelled
      if (controller.isCancelled) {
        setPlaybackController(null);
      }
    }
  };

  const handlePause = () => {
    if (playing === 'playing') {
      pause();
      // State will be updated by useEffect
    }
  };

  const handleResume = () => {
    if (playing === 'paused') {
      resume();
      // State will be updated by useEffect
    }
  };

  const handleStop = () => {
    if (playing !== 'stopped') {
      stop();
      setPlaying('stopped');
      setCurrentScene(-1);
      setCurrentLine(-1);
      setCurrentWord('');
      setCurrentContentType('');
      if (playbackController) {
        playbackController.isCancelled = true;
        setPlaybackController(null);
      }
    }
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
      <div className="screenplay-header">
        <h2>Generated Screenplay</h2>
        <button 
          onClick={() => window.location.href = '#/history'}
          className="load-different-btn"
          title="Load a different screenplay from history"
        >
          📚 Load Different
        </button>
      </div>

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
          <div className="info-row">
            <span className="info-label">Story Pitch:</span>
            <span className={`info-value ${isLanguageRTL(screenplay.default_screenplay_language) ? 'rtl-content' : ''}`}>{screenplay.story_pitch}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Exposition:</span>
            <span className={`info-value ${isLanguageRTL(screenplay.default_screenplay_language) ? 'rtl-content' : ''}`}>{screenplay.exposition}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Languages Used:</span>
            <span className="info-value">{screenplay.dialog_languages?.join(', ')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cast:</span>
            <span className={`info-value ${isLanguageRTL(screenplay.default_screenplay_language) ? 'rtl-content' : ''}`}>{screenplay.cast?.map(c => c.name).join(', ')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Scenes:</span>
            <span className="info-value">{screenplay.scenes?.length}</span>
          </div>
        </div>
      </div>

      <div className="controls">
        <button 
          onClick={() => setShowTtsOptions(!showTtsOptions)}
          className="toggle-tts-options-btn"
          disabled={playing !== 'stopped'}
        >
          {showTtsOptions ? '🔽' : '▶️'} TTS Options
        </button>
        {showTtsOptions && (
          <div className="tts-options">
            <h4>TTS Content Options:</h4>
            <label>
              <input
                type="checkbox"
                checked={ttsOptions.includeNarrator}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, includeNarrator: e.target.checked }))}
                disabled={playing !== 'stopped'}
              />
              Narrate Scenes
            </label>
            <label>
              <input
                type="checkbox"
                checked={ttsOptions.includeCharacter}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, includeCharacter: e.target.checked }))}
                disabled={playing !== 'stopped'}
              />
              Character Name
            </label>
            <label>
              <input
                type="checkbox"
                checked={ttsOptions.includeText}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, includeText: e.target.checked }))}
                disabled={playing !== 'stopped'}
              />
              Dialog Text
            </label>
            <label>
              <input
                type="checkbox"
                checked={ttsOptions.includeTranslation}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, includeTranslation: e.target.checked }))}
                disabled={playing !== 'stopped'}
              />
              Translation ({screenplay.default_screenplay_language || 'Hebrew'})
            </label>
            <label>
              <input
                type="checkbox"
                checked={ttsOptions.includeAction}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, includeAction: e.target.checked }))}
                disabled={playing !== 'stopped'}
              />
              Action
            </label>
            <label>
              <input
                type="checkbox"
                checked={ttsOptions.includeParenthetical}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, includeParenthetical: e.target.checked }))}
                disabled={playing !== 'stopped'}
              />
              Parenthetical
            </label>
            <div className="form-group-inline">
              <label>Translation Timing:</label>
              <select
                value={ttsOptions.translationTiming}
                onChange={(e) => setTtsOptions(prev => ({ ...prev, translationTiming: e.target.value }))}
                disabled={playing !== 'stopped'}
              >
                <option value="before">Before Dialog</option>
                <option value="after">After Dialog</option>
                <option value="both">Before & After</option>
              </select>
            </div>
            <div className="form-group-inline">
              <label>Default Language Speed:</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={defaultLanguageSpeed}
                onChange={(e) => setDefaultLanguageSpeed(parseFloat(e.target.value))}
                title={`Speed: ${defaultLanguageSpeed.toFixed(1)}x`}
                className={playing ? 'active-control' : ''}
              />
              <span className="speed-value">{defaultLanguageSpeed.toFixed(1)}x</span>
            </div>
          </div>
        )}
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
        {playing === 'stopped' && (
          <button
            onClick={handlePlay}
            disabled={!screenplay}
            className="play"
          >
            Play Screenplay
          </button>
        )}
        {playing === 'playing' && (
          <button onClick={handlePause} className="pause">
            Pause
          </button>
        )}
        {playing === 'paused' && (
          <button onClick={handleResume} className="resume">
            Resume
          </button>
        )}
        {(playing === 'playing' || playing === 'paused') && (
          <button onClick={handleStop} className="stop">
            Stop
          </button>
        )}
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
                {highlightText(`Scene: ${scene.scene}`, 'scene', sceneIdx)}
              </p>
              {scene.transition && (
                <p className="transition" style={{ direction: sceneHasRTL ? 'rtl' : 'ltr', textAlign: sceneHasRTL ? 'right' : 'left' }}>
                  {scene.transition}
                </p>
              )}
              {scene.dialog?.map((line, lineIdx) => {
                const langColor = LANGUAGE_COLORS[line.language] || '#6b7280';
                const isLineRTL = isLanguageRTL(line.language);

                return (
                  <div
                    key={lineIdx}
                    className={`dialog-line ${isLineRTL ? 'rtl' : 'ltr'}`}
                    style={{ 
                      borderLeft: `4px solid ${langColor}`,
                      direction: isLineRTL ? 'rtl' : 'ltr',
                      textAlign: isLineRTL ? 'right' : 'left'
                    }}
                  >
                    <div className="character" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                      {highlightText(line.character, 'character', sceneIdx, lineIdx)}
                    </div>
                    {line.parenthetical && (
                      <div className="parenthetical" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                        ({highlightText(line.parenthetical, 'parenthetical', sceneIdx, lineIdx)})
                      </div>
                    )}
                    <div className="line-text" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                      <span className="original">{highlightText(line.text, 'text', sceneIdx, lineIdx)}</span>
                    </div>
                    {line.translation && (
                      <div className="translation" style={{ direction: isLanguageRTL(screenplay.default_screenplay_language) ? 'rtl' : 'ltr', textAlign: isLanguageRTL(screenplay.default_screenplay_language) ? 'right' : 'left' }}>
                        <em>({highlightText(line.translation, 'translation', sceneIdx, lineIdx)})</em>
                      </div>
                    )}
                    {line.action && (
                      <div className="action" style={{ direction: isLineRTL ? 'rtl' : 'ltr', textAlign: isLineRTL ? 'right' : 'left' }}>
                        [{highlightText(line.action, 'action', sceneIdx, lineIdx)}]
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

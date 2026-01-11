import { useState } from 'react';
import { useScreenplay } from './useScreenplay';
import { playScreenplay, stop } from './tts';
import './ScreenplayPlayer.css';

const LANGUAGES = ['English', 'Hebrew', 'Spanish', 'French', 'Russian', 'Chinese', 'Japanese', 'Arabic', 'German', 'Italian', 'Portuguese', 'Korean', 'Dutch', 'Polish', 'Turkish', 'Hindi'];

export default function ScreenplayPlayer() {
  const [storypitch, setStorypitch] = useState('');
  const [playing, setPlaying] = useState(false);
  const [narrator, setNarrator] = useState(false);
  const [characterLang, setCharacterLang] = useState(true);
  const [languagesUsed, setLanguagesUsed] = useState(['English', 'Spanish']);
  const [defaultScreenplayLanguage, setDefaultScreenplayLanguage] = useState('Hebrew');
  const [currentScene, setCurrentScene] = useState(-1);
  const [currentLine, setCurrentLine] = useState(-1);
  const [showFormat, setShowFormat] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const { screenplay, loading, error, generate, format } = useScreenplay();

  const handleGenerate = () => {
    setCurrentScene(-1);
    setCurrentLine(-1);
    setExpandedSections({});
    generate(storypitch, languagesUsed, defaultScreenplayLanguage);
  };

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
      onLineStart: (sceneIdx, lineIdx) => {
        setCurrentScene(sceneIdx);
        setCurrentLine(lineIdx);
      }
    });
    setPlaying(false);
    setCurrentScene(-1);
    setCurrentLine(-1);
  };

  const handleStop = () => {
    stop();
    setPlaying(false);
    setCurrentScene(-1);
    setCurrentLine(-1);
  };

  const toggleLanguage = (lang) => {
    setLanguagesUsed(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const expandAll = () => {
    const newExpanded = {};
    const recurse = (obj, prefix = '') => {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => {
          const key = `${prefix}.${idx}`;
          newExpanded[key] = true;
          recurse(item, key);
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([k, v]) => {
          const key = `${prefix}.${k}`;
          newExpanded[key] = true;
          recurse(v, key);
        });
      }
    };
    recurse(format, 'format');
    setExpandedSections(newExpanded);
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

  return (
    <div className="container">
      <h1>Screenplay Generator & Player</h1>

      {format && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 onClick={() => setShowFormat(!showFormat)} style={{ cursor: 'pointer', margin: 0 }}>
              {showFormat ? '[-]' : '[+]'} Response Format Schema
            </h2>
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
          </div>
          {showFormat && (
            <div className="format-display">
              {renderValue(format, 'format')}
            </div>
          )}
        </div>
      )}

      <div className="section">
        <h2>Generate Screenplay</h2>
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
          <label>Languages Used (for character dialogue)</label>
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
          <label>Default Screenplay Language (for all text except dialogue)</label>
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

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Screenplay'}
        </button>
        {loading && <div className="loading-indicator">Generating screenplay...</div>}
        {error && <p className="error">{error}</p>}
      </div>

      {screenplay && (
        <div className="section">
          <h2>Generated Screenplay</h2>

          <div className="screenplay-preview">
            <h3>Quick Preview</h3>
            <div className="screenplay-info">
              <p><strong>Story Pitch:</strong> {screenplay.story_pitch}</p>
              <p><strong>Exposition:</strong> {screenplay.exposition}</p>
              <p><strong>Languages Used:</strong> {screenplay.languages_used?.join(', ')}</p>
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

          <div className="readable-screenplay">
            <h2>Readable Format</h2>
            {screenplay.scenes?.map((scene, sceneIdx) => (
              <div key={sceneIdx} className="scene">
                <h3>{scene.scene_heading || `Scene ${sceneIdx + 1}`}</h3>
                <p className="scene-description">{scene.scene}</p>
                {scene.transition && <p className="transition">{scene.transition}</p>}
                {scene.dialogue?.map((line, lineIdx) => (
                  <div
                    key={lineIdx}
                    className={`dialogue-line ${sceneIdx === currentScene && lineIdx === currentLine ? 'active' : ''}`}
                  >
                    <div className="character">{line.character}</div>
                    {line.parenthetical && <div className="parenthetical">({line.parenthetical})</div>}
                    <div className="line-text">
                      <span className="original">({line.language}) {line.text}</span>
                    </div>
                    {line.action && <div className="action">[{line.action}]</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
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

export default function ScreenplayPlayer({ screenplay: passedScreenplay }) {
  const [screenplay, setScreenplay] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Use passed screenplay from history or wait for user to generate one
  useEffect(() => {
    if (passedScreenplay) {
      setScreenplay(passedScreenplay);
    }
  }, [passedScreenplay]);

  if (!screenplay) {
    return (
      <div className={`container ${darkMode ? 'dark' : ''}`}>
        <div className="header">
          <h1>Screenplay Viewer</h1>
          <button 
            className="dark-mode-toggle" 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="section">
          <h2>Load Screenplay</h2>
          <p>Select a screenplay from History to view it here, or generate a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>Screenplay Viewer</h1>
        <button 
          className="dark-mode-toggle" 
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="screenplay-preview">
        <h3>Screenplay Information</h3>
        <div className="screenplay-info">
          <p><strong>Story Pitch:</strong> {screenplay.story_pitch}</p>
          <p><strong>Exposition:</strong> {screenplay.exposition}</p>
          <p><strong>Languages Used:</strong> {screenplay.dialog_languages?.join(', ')}</p>
          <p><strong>Cast:</strong> {screenplay.cast?.map(c => c.name).join(', ')}</p>
          <p><strong>Scenes:</strong> {screenplay.scenes?.length}</p>
        </div>
      </div>

      <div className="readable-screenplay">
        <h2>Screenplay</h2>
        {screenplay.scenes?.map((scene, sceneIdx) => (
          <div key={sceneIdx} className="scene">
            <h3>{scene.scene_heading || `Scene ${sceneIdx + 1}`}</h3>
            <p className="scene-description">{scene.scene}</p>
            {scene.transition && <p className="transition">{scene.transition}</p>}
            {scene.dialog?.map((line, lineIdx) => {
              const langColor = LANGUAGE_COLORS[line.language] || '#6b7280';

              return (
                <div
                  key={lineIdx}
                  className="dialog-line"
                  style={{ borderLeft: `4px solid ${langColor}` }}
                >
                  <div className="character">{line.character}</div>
                  {line.parenthetical && <div className="parenthetical">({line.parenthetical})</div>}
                  <div className="line-text">
                    <span className="original">{line.text}</span>
                  </div>
                  {line.action && <div className="action">[{line.action}]</div>}
                  {line.translation && <div className="translation">{line.translation}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
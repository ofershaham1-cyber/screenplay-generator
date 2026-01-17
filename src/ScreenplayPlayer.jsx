import { useState, useEffect } from 'react';
import ScreenplayView from './ScreenplayView';
import './ScreenplayPlayer.css';

export default function ScreenplayPlayer({ screenplay: passedScreenplay }) {
  const [screenplay, setScreenplay] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showFormat, setShowFormat] = useState(false);

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

      <ScreenplayView
        screenplay={screenplay}
        format={null}
        darkMode={darkMode}
        showFormat={showFormat}
        onShowFormatChange={setShowFormat}
      />
    </div>
  );
}
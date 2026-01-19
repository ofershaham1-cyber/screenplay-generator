import { useEffect, useState } from 'react';
import './AppHeader.css';

const AppHeader = ({ isGenerating = false, theme, updateTheme }) => {
  const [debug, setDebug] = useState(false);

  // Initialize debug from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    const debugParam = params.get('debug') === 'true';
    setDebug(debugParam);
  }, []);

  // Update URL hash params when debug changes
  const updateHashParams = (newDebug) => {
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    if (newDebug) {
      params.set('debug', 'true');
    } else {
      params.delete('debug');
    }
    params.set('theme', theme);
    
    const newHash = params.toString() ? `#${params.toString()}` : '#';
    window.location.hash = newHash;
  };

  const handleDebugToggle = () => {
    const newDebug = !debug;
    setDebug(newDebug);
    updateHashParams(newDebug);
  };

  return (
    <header className="app-header">
      <h1>Screenplay Generator</h1>
      <div className="header-controls">
        {isGenerating && (
          <div className="header-loading-indicator">
            <span className="loading-spinner">⏳</span>
            Generating...
          </div>
        )}
        <button
          className={`debug-btn ${debug ? 'active' : ''}`}
          onClick={handleDebugToggle}
          title={debug ? 'Disable Debug' : 'Enable Debug'}
        >
          🐛
        </button>
      </div>
    </header>
  );
};

export default AppHeader;

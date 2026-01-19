import { useEffect, useState } from 'react';
import './AppHeader.css';

const AppHeader = ({ isGenerating = false, showSuccessIcon = false, generationError = null, theme, setTheme, design, setDesign }) => {
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
    params.set('design', design);
    
    const newHash = params.toString() ? `#${params.toString()}` : '#';
    window.location.hash = newHash;
  };

  const handleDebugToggle = () => {
    const newDebug = !debug;
    setDebug(newDebug);
    updateHashParams(newDebug);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    updateHashParams(debug);
  };

  const handleDesignChange = (newDesign) => {
    setDesign(newDesign);
    updateHashParams(debug);
  };

  return (
    <header className="app-header">
      <h1>Screenplay Generator</h1>
      <div className="header-controls">
        {isGenerating && (
          <div className="header-loading-indicator">
            <div className="spinner"></div>
            <span>Generating screenplay...</span>
          </div>
        )}
        {!isGenerating && showSuccessIcon && !generationError && (
          <div className="header-success-indicator">
            <span>✓ Screenplay generated!</span>
          </div>
        )}
        {!isGenerating && generationError && (
          <div className="header-error-indicator">
            <span>✗ Generation failed</span>
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

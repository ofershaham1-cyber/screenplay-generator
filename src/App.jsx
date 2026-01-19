import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ScreenplayGenerator from './ScreenplayGenerator';
import ScreenplayPlayer from './ScreenplayPlayer';
import ScreenplayHistoryView from './ScreenplayHistoryView';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { useScreenplayHistory } from './useScreenplayHistory';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { history, addToHistory, removeFromHistory, clearHistory, getHistoryItem, exportScreenplay, importScreenplay, storageInfo } = useScreenplayHistory();
  const [selectedHistoryScreenplay, setSelectedHistoryScreenplay] = useState(null);
  const [theme, setTheme] = useState('light');
  
  // Persist screenplay generation across navigation
  const [generatingScreenplay, setGeneratingScreenplay] = useState(null);
  const [generatingParams, setGeneratingParams] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize theme from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    const themeParam = params.get('theme') || 'light';
    setTheme(themeParam);
    document.documentElement.setAttribute('data-theme', themeParam);
  }, []);

  // Keep theme in sync with URL and DOM
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    params.set('theme', newTheme);
    const newHash = params.toString() ? `#${params.toString()}` : '#';
    window.location.hash = newHash;
  };

  const handleScreenplayGenerated = (screenplay, params) => {
    // Save to history and persist generation state
    setGeneratingScreenplay(screenplay);
    setGeneratingParams(params);
    setIsGenerating(false);
    addToHistory(screenplay, params);
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const handleGenerationEnd = () => {
    setIsGenerating(false);
  };

  const handleViewHistoryScreenplay = (historyItem) => {
    setSelectedHistoryScreenplay(historyItem);
    navigate('/player');
  };

  return (
    <div className="app">
      <AppHeader isGenerating={isGenerating} theme={theme} updateTheme={updateTheme} />
      <div className="app-body">
        <Sidebar theme={theme} updateTheme={updateTheme} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<ScreenplayGenerator onScreenplayGenerated={handleScreenplayGenerated} generatingScreenplay={generatingScreenplay} onGenerationStart={handleGenerationStart} onGenerationEnd={handleGenerationEnd} />}
            />
            <Route
              path="/generator"
              element={<ScreenplayGenerator onScreenplayGenerated={handleScreenplayGenerated} generatingScreenplay={generatingScreenplay} onGenerationStart={handleGenerationStart} onGenerationEnd={handleGenerationEnd} />}
            />
            <Route path="/player" element={<ScreenplayPlayer screenplay={selectedHistoryScreenplay?.screenplay || generatingScreenplay} />} />
            <Route
              path="/history"
              element={
                <ScreenplayHistoryView
                  history={history}
                  onSelectScreenplay={handleViewHistoryScreenplay}
                  onRemoveScreenplay={removeFromHistory}
                  onClearHistory={clearHistory}
                  onExportScreenplay={exportScreenplay}
                  onImportScreenplay={importScreenplay}
                  storageInfo={storageInfo}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ScreenplayGenerator from './ScreenplayGenerator';
import ScreenplayPlayer from './ScreenplayPlayer';
import ScreenplayResult from './ScreenplayResult';
import ScreenplayHistoryView from './ScreenplayHistoryView';
import ScreenplayPreferences from './ScreenplayPreferences';
import ScreenplayFormatSchema from './ScreenplayFormatSchema';
import ViewModels from './ViewModels';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { useScreenplayHistory } from './useScreenplayHistory';
import { useScreenplay } from './useScreenplay';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { history, addToHistory, removeFromHistory, clearHistory, getHistoryItem, exportScreenplay, importScreenplay, storageInfo } = useScreenplayHistory();
  const { error: generationError } = useScreenplay();
  const [selectedHistoryScreenplay, setSelectedHistoryScreenplay] = useState(null);
  const [theme, setTheme] = useState('light');
  const [design, setDesign] = useState('standard');
  
  // Persist screenplay generation across navigation
  const [generatingScreenplay, setGeneratingScreenplay] = useState(null);
  const [generatingParams, setGeneratingParams] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [multiModelResults, setMultiModelResults] = useState(null);

  // Initialize theme from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    const themeParam = params.get('theme') || 'light';
    const designParam = params.get('design') || 'standard';
    setTheme(themeParam);
    setDesign(designParam);
    document.documentElement.setAttribute('data-theme', themeParam);
  }, []);

  // Keep theme in sync with URL and DOM
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    params.set('theme', newTheme);
    params.set('design', design);
    const newHash = params.toString() ? `#${params.toString()}` : '#';
    window.location.hash = newHash;
  };

  const updateDesign = (newDesign) => {
    setDesign(newDesign);
    
    const params = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    params.set('theme', theme);
    params.set('design', newDesign);
    const newHash = params.toString() ? `#${params.toString()}` : '#';
    window.location.hash = newHash;
  };

  const handleScreenplayGenerated = (screenplay, params) => {
    // Save to history and persist generation state
    setGeneratingScreenplay(screenplay);
    setGeneratingParams(params);
    setIsGenerating(false);
    
    // Save to history (only the main screenplay)
    addToHistory(screenplay, params);
    
    // Navigate to result page after generation
    navigate('/screenplay-result');
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

  // Show success icon for a few seconds after generation completes
  useEffect(() => {
    if (!isGenerating && generatingParams !== null) {
      setShowSuccessIcon(true);
      const timeout = setTimeout(() => setShowSuccessIcon(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [isGenerating, generatingParams]);

  return (
    <div className="app">
      <AppHeader isGenerating={isGenerating} showSuccessIcon={showSuccessIcon} generationError={generationError} theme={theme} setTheme={setTheme} design={design} setDesign={setDesign} />
      <div className="app-body">
        <Sidebar theme={theme} updateTheme={updateTheme} design={design} updateDesign={updateDesign} />
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
              path="/screenplay-result"
              element={<ScreenplayResult screenplay={generatingScreenplay} generatingParams={generatingParams} />}
            />
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
            <Route
              path="/preferences"
              element={<ScreenplayPreferences theme={theme} design={design} />}
            />
            <Route
              path="/format-schema"
              element={<ScreenplayFormatSchema />}
            />
            <Route
              path="/view-models"
              element={<ViewModels />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

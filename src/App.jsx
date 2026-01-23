import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LANGUAGES, DEFAULT_LANGUAGE, DEFAULT_DIALOG_LANGUAGES } from './config/languages';
import { DEFAULT_STORY_PITCH, DEFAULT_THEME, DEFAULT_DESIGN, DEFAULT_SCREENPLAY_LANGUAGE } from './config/defaults';
import ScreenplayGenerator from './ScreenplayGenerator';
import ScreenplayOngoingRequests from './ScreenplayOngoingRequests';
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
  const { error: generationError, activeModels, requestStates, cancelRequest, cancelAllRequests, clearRequestHistory, multiModelResults } = useScreenplay();
  const [selectedHistoryScreenplay, setSelectedHistoryScreenplay] = useState(null);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  
  // Persist screenplay generation across navigation
  const [generatingScreenplay, setGeneratingScreenplay] = useState(null);
  const [generatingParams, setGeneratingParams] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  
  // Generator form state - persists across navigation
  const [storypitch, setStorypitch] = useState(DEFAULT_STORY_PITCH);
  const [languagesUsed, setLanguagesUsed] = useState(DEFAULT_DIALOG_LANGUAGES);
  const [defaultScreenplayLanguage, setDefaultScreenplayLanguage] = useState(DEFAULT_SCREENPLAY_LANGUAGE);
  const [minLinesPerDialog, setMinLinesPerDialog] = useState(50);
  const [useMultipleModels, setUseMultipleModels] = useState(true);
  const [overrideApiKey, setOverrideApiKey] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);

  // Load generator preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('screenplay_generator_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.storypitch !== undefined) setStorypitch(parsed.storypitch);
        if (parsed.languagesUsed) setLanguagesUsed(parsed.languagesUsed);
        if (parsed.defaultScreenplayLanguage) setDefaultScreenplayLanguage(parsed.defaultScreenplayLanguage);
        if (parsed.minLinesPerDialog !== undefined) setMinLinesPerDialog(parsed.minLinesPerDialog);
        if (parsed.useMultipleModels !== undefined) setUseMultipleModels(parsed.useMultipleModels);
        if (parsed.overrideApiKey !== undefined) setOverrideApiKey(parsed.overrideApiKey);
        if (parsed.selectedModels) setSelectedModels(parsed.selectedModels);
      }
    } catch (err) {
      console.warn('Failed to load generator state from localStorage:', err);
    }
  }, []);

  // Save generator preferences to localStorage whenever they change
  useEffect(() => {
    try {
      const stateToSave = {
        storypitch,
        languagesUsed,
        defaultScreenplayLanguage,
        minLinesPerDialog,
        useMultipleModels,
        overrideApiKey,
        selectedModels
      };
      localStorage.setItem('screenplay_generator_state', JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('Failed to save generator state to localStorage:', err);
    }
  }, [storypitch, languagesUsed, defaultScreenplayLanguage, minLinesPerDialog, useMultipleModels, overrideApiKey, selectedModels]);

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
    // For multi-model generation, store all responses
    if (params.multiModel) {
      // Store the current screenplay (this will be the last one)
      setGeneratingScreenplay(screenplay);
      setGeneratingParams(params);
    } else {
      // For single model, store directly
      setGeneratingScreenplay(screenplay);
      setGeneratingParams(params);
    }
    
    // Add to history - each response is added as a separate entry
    addToHistory(screenplay, {
      ...params,
      generatedAt: new Date().toISOString()
    });
    
    // For single model generation, navigate to result page
    if (!params.multiModel) {
      setIsGenerating(false);
      navigate('/screenplay-result');
    }
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
        <Sidebar theme={theme} updateTheme={updateTheme} design={design} updateDesign={updateDesign} historyCount={history.length} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <ScreenplayGenerator 
                  onScreenplayGenerated={handleScreenplayGenerated} 
                  generatingScreenplay={generatingScreenplay} 
                  onGenerationStart={handleGenerationStart} 
                  onGenerationEnd={handleGenerationEnd}
                  storypitch={storypitch}
                  setStorypitch={setStorypitch}
                  languagesUsed={languagesUsed}
                  setLanguagesUsed={setLanguagesUsed}
                  defaultScreenplayLanguage={defaultScreenplayLanguage}
                  setDefaultScreenplayLanguage={setDefaultScreenplayLanguage}
                  minLinesPerDialog={minLinesPerDialog}
                  setMinLinesPerDialog={setMinLinesPerDialog}
                  useMultipleModels={useMultipleModels}
                  setUseMultipleModels={setUseMultipleModels}
                  overrideApiKey={overrideApiKey}
                  setOverrideApiKey={setOverrideApiKey}
                  selectedModels={selectedModels}
                  setSelectedModels={setSelectedModels}
                />
              }
            />
            <Route
              path="/generator"
              element={
                <ScreenplayGenerator 
                  onScreenplayGenerated={handleScreenplayGenerated} 
                  generatingScreenplay={generatingScreenplay} 
                  onGenerationStart={handleGenerationStart} 
                  onGenerationEnd={handleGenerationEnd}
                  storypitch={storypitch}
                  setStorypitch={setStorypitch}
                  languagesUsed={languagesUsed}
                  setLanguagesUsed={setLanguagesUsed}
                  defaultScreenplayLanguage={defaultScreenplayLanguage}
                  setDefaultScreenplayLanguage={setDefaultScreenplayLanguage}
                  minLinesPerDialog={minLinesPerDialog}
                  setMinLinesPerDialog={setMinLinesPerDialog}
                  useMultipleModels={useMultipleModels}
                  setUseMultipleModels={setUseMultipleModels}
                  overrideApiKey={overrideApiKey}
                  setOverrideApiKey={setOverrideApiKey}
                  selectedModels={selectedModels}
                  setSelectedModels={setSelectedModels}
                />
              }
            />
            <Route
              path="/ongoing"
              element={
                <ScreenplayOngoingRequests
                  selectedModels={selectedModels}
                  requestStates={requestStates}
                  activeModels={activeModels}
                  cancelRequest={cancelRequest}
                  cancelAllRequests={cancelAllRequests}
                  multiModelResults={multiModelResults}
                  isGenerating={isGenerating}
                  onClearResults={clearRequestHistory}
                />
              }
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

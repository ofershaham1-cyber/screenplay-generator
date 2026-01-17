import { useState } from 'react';
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
  
  // Persist screenplay generation across navigation
  const [generatingScreenplay, setGeneratingScreenplay] = useState(null);
  const [generatingParams, setGeneratingParams] = useState(null);

  const handleScreenplayGenerated = (screenplay, params) => {
    // Save to history and persist generation state
    setGeneratingScreenplay(screenplay);
    setGeneratingParams(params);
    addToHistory(screenplay, params);
  };

  const handleViewHistoryScreenplay = (historyItem) => {
    setSelectedHistoryScreenplay(historyItem);
    navigate('/player');
  };

  return (
    <div className="app">
      <AppHeader />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<ScreenplayGenerator onScreenplayGenerated={handleScreenplayGenerated} generatingScreenplay={generatingScreenplay} />}
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

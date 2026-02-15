import ScreenplayHistory from './ScreenplayHistory';
import './ScreenplayHistoryView.css';
import { useState, useEffect } from 'react';

export default function ScreenplayHistoryView({
  history,
  onSelectScreenplay,
  onRemoveScreenplay,
  onClearHistory,
  onExportScreenplay,
  onImportScreenplay,
  storageInfo,
}) {
  const [initialFilterType, setInitialFilterType] = useState('all');

  // Parse URL hash for filter type parameter
  useEffect(() => {
    const parseHashParams = () => {
      const hash = window.location.hash.substring(1); // Remove #
      const params = new URLSearchParams(hash);
      const type = params.get('type') || 'all';
      setInitialFilterType(type === 'screenplay' || type === 'audiobook' ? type : 'all');
    };

    parseHashParams();
    
    // Listen for hash changes
    const handleHashChange = () => {
      parseHashParams();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="history-view">
      <div className="history-view-header">
        <h1>📚 Screenplay & Audiobook History</h1>
        <p>View, manage, and share your previously generated screenplays and audiobooks</p>
      </div>
      <div className="history-view-content">
        <ScreenplayHistory
          history={history}
          onSelectScreenplay={onSelectScreenplay}
          onRemoveScreenplay={onRemoveScreenplay}
          onClearHistory={onClearHistory}
          onExportScreenplay={onExportScreenplay}
          onImportScreenplay={onImportScreenplay}
          storageInfo={storageInfo}
          initialFilterType={initialFilterType}
        />
      </div>
    </div>
  );
}

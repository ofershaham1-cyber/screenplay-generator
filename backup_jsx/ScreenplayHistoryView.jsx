import ScreenplayHistory from './ScreenplayHistory';
import './ScreenplayHistoryView.css';

export default function ScreenplayHistoryView({
  history,
  onSelectScreenplay,
  onRemoveScreenplay,
  onClearHistory,
  onExportScreenplay,
  onImportScreenplay,
  storageInfo,
}) {
  return (
    <div className="history-view">
      <div className="history-view-header">
        <h1>📚 Screenplay History</h1>
        <p>View, manage, and share your previously generated screenplays</p>
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
        />
      </div>
    </div>
  );
}

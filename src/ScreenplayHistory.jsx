import { useState } from 'react';
import './ScreenplayHistory.css';

export default function ScreenplayHistory({ 
  history, 
  onSelectScreenplay, 
  onRemoveScreenplay, 
  onClearHistory,
  onExportScreenplay,
  onImportScreenplay,
  storageInfo
}) {
  const [expandedId, setExpandedId] = useState(null);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const truncateText = (text, length = 50) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const getScreenplayPreview = (screenplay) => {
    if (!screenplay) return null;
    return {
      castCount: screenplay.cast?.length || 0,
      sceneCount: screenplay.scenes?.length || 0,
      exposition: screenplay.exposition || '',
    };
  };

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onImportScreenplay(file);
        event.target.value = ''; // Reset input
      } catch (err) {
        alert('Failed to import screenplay: ' + err.message);
      }
    }
  };

  if (history.length === 0) {
    return (
      <div className="screenplay-history">
        <div className="empty-state">
          <p>No screenplay history yet.</p>
          <p>Generate a screenplay to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screenplay-history">
      <div className="history-header">
        <h3>📚 History</h3>
        <div className="header-actions">
          <label className="import-btn" title="Import screenplay">
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
          </label>
          <button className="clear-history-btn" onClick={onClearHistory} title="Clear all history">
            🗑️ Clear
          </button>
        </div>
      </div>

      {storageInfo && (
        <div className="storage-info">
          <small>
            💾 Storage: <strong>{storageInfo.used.toFixed(2)} KB</strong> used | 
            <strong>{Math.max(0, storageInfo.available).toFixed(2)} KB</strong> available
          </small>
        </div>
      )}

      <div className="history-list">
        {history.map((item) => {
          const preview = getScreenplayPreview(item.screenplay);
          const isExpanded = expandedId === item.id;
          
          return (
            <div key={item.id} className="history-item">
              <div
                className="history-item-header"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="history-item-info">
                  <div className="history-title">
                    {item.params.story_pitch ? truncateText(item.params.story_pitch) : 'Original Screenplay'}
                  </div>
                  <div className="history-date">{formatDate(item.timestamp)}</div>
                  <div className="history-meta">
                    <span className="history-lang">
                      {item.params.dialog_languages?.length > 0
                        ? item.params.dialog_languages.join(', ')
                        : 'No languages'}
                    </span>
                    <span className="history-model">{item.params.model || 'Unknown model'}</span>
                  </div>
                  {preview && (
                    <div className="history-stats">
                      <span className="stat">👥 {preview.castCount} characters</span>
                      <span className="stat">🎬 {preview.sceneCount} scenes</span>
                    </div>
                  )}
                </div>
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              </div>

              {isExpanded && (
                <div className="history-item-details">
                  <div className="history-details-content">
                    {item.params.story_pitch && (
                      <div className="detail-field">
                        <strong>Pitch:</strong>
                        <p>{item.params.story_pitch}</p>
                      </div>
                    )}
                    <div className="detail-field">
                      <strong>Default Language:</strong>
                      <p>{item.params.default_screenplay_language || 'N/A'}</p>
                    </div>
                    {preview?.exposition && (
                      <div className="detail-field">
                        <strong>Story Context:</strong>
                        <p>{preview.exposition}</p>
                      </div>
                    )}
                    {preview && (
                      <div className="detail-field">
                        <strong>Content:</strong>
                        <p>{preview.castCount} character(s) in {preview.sceneCount} scene(s)</p>
                      </div>
                    )}
                  </div>

                  <div className="history-item-actions">
                    <button
                      className="view-btn"
                      onClick={() => onSelectScreenplay(item)}
                      title="View this screenplay"
                    >
                      👁️ View
                    </button>
                    <button
                      className="export-btn"
                      onClick={() => onExportScreenplay(item.id)}
                      title="Download screenplay as JSON"
                    >
                      📥 Export
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => onRemoveScreenplay(item.id)}
                      title="Delete from history"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


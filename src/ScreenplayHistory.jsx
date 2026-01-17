import { useState } from 'react';
import './ScreenplayHistory.css';

// RTL languages
const RTL_LANGUAGES = ['Arabic', 'Hebrew', 'Urdu', 'Persian', 'Farsi', 'Pashto', 'Kurdish'];

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

  const isRTL = (languages) => {
    if (!languages || languages.length === 0) return false;
    return languages.some(lang => RTL_LANGUAGES.includes(lang));
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const truncateText = (text, length = 50) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onImportScreenplay(file);
        event.target.value = '';
      } catch (err) {
        alert('Failed to import screenplay: ' + err.message);
      }
    }
  };

  // Show empty state if no history
  if (!history || history.length === 0) {
    return (
      <div className="screenplay-history">
        <div className="empty-state">
          <p>📭 No screenplay history yet.</p>
          <p>Generate a screenplay to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screenplay-history">
      {/* Header with actions */}
      <div className="history-header">
        <h3>📚 Screenplay History ({history.length})</h3>
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
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Storage info */}
      {storageInfo && storageInfo.used !== undefined && (
        <div className="storage-info">
          <small>
            💾 Storage: <strong>{parseFloat(storageInfo.used).toFixed(2)} KB</strong> used | 
            <strong>{Math.max(0, parseFloat(storageInfo.available)).toFixed(2)} KB</strong> available
          </small>
        </div>
      )}

      {/* History list */}
      <div className="history-list">
        {history.map((item) => {
          if (!item || !item.screenplay) return null;
          
          const screenplay = item.screenplay;
          const params = item.params || {};
          const isExpanded = expandedId === item.id;
          const languages = params.dialog_languages || [];
          const shouldBeRTL = isRTL(languages);
          
          const castCount = screenplay.cast?.length || 0;
          const sceneCount = screenplay.scenes?.length || 0;
          const pitch = params.story_pitch || 'Original Screenplay';
          
          return (
            <div 
              key={item.id} 
              className={`history-item ${shouldBeRTL ? 'rtl' : 'ltr'}`}
              style={{ direction: shouldBeRTL ? 'rtl' : 'ltr' }}
            >
              {/* Clickable header */}
              <div
                className="history-item-header"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') setExpandedId(isExpanded ? null : item.id);
                }}
              >
                <div className="history-item-info" style={{ direction: shouldBeRTL ? 'rtl' : 'ltr' }}>
                  <div className="history-title" style={{ textAlign: shouldBeRTL ? 'right' : 'left', direction: shouldBeRTL ? 'rtl' : 'ltr' }}>
                    {truncateText(pitch, 60)}
                  </div>
                  <div className="history-date" style={{ textAlign: shouldBeRTL ? 'right' : 'left' }}>
                    📅 {formatDate(item.timestamp)}
                  </div>
                  <div className="history-meta" style={{ justifyContent: shouldBeRTL ? 'flex-end' : 'flex-start', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {languages && languages.length > 0 && (
                      <span className="history-lang" style={{ textAlign: shouldBeRTL ? 'right' : 'left' }}>
                        🗣️ {languages.join(', ')}
                      </span>
                    )}
                    {params.model && (
                      <span className="history-model" style={{ textAlign: shouldBeRTL ? 'right' : 'left' }}>
                        🤖 {params.model}
                      </span>
                    )}
                  </div>
                  <div className="history-stats" style={{ justifyContent: shouldBeRTL ? 'flex-end' : 'flex-start', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="stat">👥 {castCount} character{castCount !== 1 ? 's' : ''}</span>
                    <span className="stat">🎬 {sceneCount} scene{sceneCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="history-item-details" style={{ direction: shouldBeRTL ? 'rtl' : 'ltr' }}>
                  <div className="history-details-content" style={{ textAlign: shouldBeRTL ? 'right' : 'left', direction: shouldBeRTL ? 'rtl' : 'ltr' }}>
                    {params.story_pitch && (
                      <div className="detail-field">
                        <strong style={{ display: 'block', textAlign: shouldBeRTL ? 'right' : 'left' }}>📖 Story Pitch:</strong>
                        <p style={{ direction: shouldBeRTL ? 'rtl' : 'ltr', textAlign: shouldBeRTL ? 'right' : 'left', marginTop: '8px' }}>
                          {params.story_pitch}
                        </p>
                      </div>
                    )}
                    {params.default_screenplay_language && (
                      <div className="detail-field">
                        <strong style={{ display: 'block', textAlign: shouldBeRTL ? 'right' : 'left' }}>🌍 Default Language:</strong>
                        <p style={{ textAlign: shouldBeRTL ? 'right' : 'left', marginTop: '8px' }}>{params.default_screenplay_language}</p>
                      </div>
                    )}
                    {screenplay.exposition && (
                      <div className="detail-field">
                        <strong style={{ display: 'block', textAlign: shouldBeRTL ? 'right' : 'left' }}>📝 Story Context:</strong>
                        <p style={{ direction: shouldBeRTL ? 'rtl' : 'ltr', textAlign: shouldBeRTL ? 'right' : 'left', marginTop: '8px' }}>
                          {screenplay.exposition}
                        </p>
                      </div>
                    )}
                    <div className="detail-field">
                      <strong style={{ display: 'block', textAlign: shouldBeRTL ? 'right' : 'left' }}>📊 Content Details:</strong>
                      <p style={{ textAlign: shouldBeRTL ? 'right' : 'left', marginTop: '8px' }}>{castCount} character{castCount !== 1 ? 's' : ''} in {sceneCount} scene{sceneCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="history-item-actions" style={{ justifyContent: shouldBeRTL ? 'flex-end' : 'flex-start' }}>
                    <button
                      className="load-btn"
                      onClick={() => onSelectScreenplay(item)}
                      title="Load this screenplay for viewing"
                    >
                      📂 Load
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


import './ScreenplayGenerator.css';

export default function ScreenplayOngoingRequests({ 
  selectedModels, 
  requestStates, 
  activeModels, 
  cancelRequest, 
  cancelAllRequests,
  multiModelResults,
  isGenerating,
  onClearResults
}) {
  // Check if there are any models to show (either currently generating or have results)
  const hasModels = selectedModels && selectedModels.length > 0;
  const hasResults = requestStates && Object.keys(requestStates).length > 0;
  
  console.log('[ScreenplayOngoingRequests] Props:', {
    selectedModels,
    activeModels,
    requestStates,
    isGenerating,
    hasModels,
    hasResults
  });
  
  if (!hasModels && !hasResults) {
    return (
      <div className="container">
        <div className="section">
          <div className="header">
            <h2>Ongoing Generation</h2>
          </div>
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No generation in progress. Start a generation from the generator page to see progress here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section">
        <div className="header">
          <h2>{isGenerating ? 'Generation in Progress' : 'Generation Results'}</h2>
        </div>

        <div className="model-status" style={{ padding: '15px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
            {isGenerating 
              ? `Generating for ${selectedModels.length} model(s)...`
              : `Completed ${selectedModels.length} model generation(s)`
            }
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedModels.map(model => {
              const status = requestStates[model];
              const isActive = activeModels.includes(model) || status?.status === 'pending';
              const resultItem = multiModelResults[model];
              const statusColor = isActive 
                ? '#0066cc' 
                : status?.status === 'completed'
                  ? '#28a745' 
                  : status?.status === 'failed'
                    ? '#dc3545' 
                    : status?.status === 'cancelled'
                      ? '#ffc107'
                      : '#ddd';

              const statusLabel = isActive 
                ? '⏳ Generating' 
                : status?.status === 'completed'
                  ? '✓ Complete' 
                  : status?.status === 'failed'
                    ? '✗ Error' 
                    : status?.status === 'cancelled'
                      ? '◆ Cancelled'
                      : '⏸ Pending';

              const elapsedTime = status?.duration 
                ? `${(status.duration / 1000).toFixed(1)}s`
                : status?.startTime
                  ? `${((Date.now() - status.startTime) / 1000).toFixed(1)}s`
                  : '-';

              return (
                <div 
                  key={model}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#fafafa',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${statusColor}`
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {model}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {elapsedTime}
                    </div>
                    {resultItem?.error && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={resultItem.error}>
                        Error: {resultItem.error}
                      </div>
                    )}
                    {status?.error && !resultItem?.error && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={status.error}>
                        Error: {status.error}
                      </div>
                    )}
                  </div>

                  <span style={{ 
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '3px',
                    backgroundColor: isActive ? '#e3f2fd' : status?.status === 'completed' ? '#d4edda' : status?.status === 'failed' ? '#f8d7da' : status?.status === 'cancelled' ? '#fff3cd' : '#e9ecef',
                    color: statusColor,
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    {statusLabel}
                  </span>

                  {isActive && (
                    <button
                      onClick={() => {
                        console.log(`Cancelling model: ${model}`);
                        cancelRequest(model);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Cancel this model's generation"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          {requestStates && Object.keys(requestStates).length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#f9f9f9',
              borderRadius: '3px',
              fontSize: '13px',
              color: '#666'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Summary:</strong>
              </div>
              <div>
                Generating: {activeModels.length} | 
                Completed: {Object.values(requestStates).filter(s => s.status === 'completed').length} | 
                Failed: {Object.values(requestStates).filter(s => s.status === 'failed').length} | 
                Cancelled: {Object.values(requestStates).filter(s => s.status === 'cancelled').length}
              </div>
            </div>
          )}

          {/* Cancel all button */}
          {activeModels.length > 0 && (
            <button
              onClick={cancelAllRequests}
              style={{
                marginTop: '15px',
                padding: '10px 15px',
                fontSize: '13px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: '500'
              }}
            >
              Cancel All Requests
            </button>
          )}
        </div>

        {/* Estimated time remaining */}
        {activeModels.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#fffbea',
            borderLeft: '3px solid #ffc107',
            borderRadius: '3px',
            fontSize: '12px',
            color: '#856404'
          }}>
            <strong>⏱️ Tip:</strong> Screenplay generation can take 1-5 minutes per model depending on the service. You can leave this page and come back to check progress.
          </div>
        )}
        
        {/* Clear results button - shown when generation is complete */}
        {!isGenerating && hasResults && onClearResults && (
          <button
            onClick={onClearResults}
            style={{
              marginTop: '15px',
              padding: '10px 15px',
              fontSize: '13px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              width: '100%',
              fontWeight: '500'
            }}
          >
            Clear Results
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import './ScreenplayRequests.css';

// Simple JSON schema validator for screenplay response format
const validateScreenplayFormat = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Response must be a JSON object');
    return { valid: false, errors };
  }

  // Check required top-level fields
  const requiredFields = ['limitations', 'default_screenplay_language', 'story_pitch', 'exposition', 'dialog_languages', 'cast', 'scenes'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Validate scenes structure if present
  if (data.scenes && Array.isArray(data.scenes)) {
    data.scenes.forEach((scene: any, idx: number) => {
      if (!scene.scene_heading) errors.push(`Scene ${idx}: Missing "scene_heading"`);
      if (!scene.dialog || !Array.isArray(scene.dialog)) {
        errors.push(`Scene ${idx}: Missing or invalid "dialog" array`);
      } else {
        scene.dialog.forEach((line: any, lineIdx: number) => {
          const lineRequiredFields = ['character', 'language', 'text', 'translation'];
          for (const field of lineRequiredFields) {
            if (!(field in line)) {
              errors.push(`Scene ${idx}, Dialog ${lineIdx}: Missing "${field}"`);
            }
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

interface RequestState {
  status: 'pending' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface ScreenplayRequestsProps {
  selectedModels: string[];
  requestStates: Record<string, RequestState>;
  activeModels: string[];
  cancelRequest: (id: string) => void;
  cancelAllRequests: () => void;
  multiModelResults: any[];
  isGenerating: boolean;
  onClearResults: () => void;
}

const ScreenplayRequests: React.FC<ScreenplayRequestsProps> = ({
  selectedModels,
  requestStates,
  activeModels,
  cancelRequest,
  cancelAllRequests,
  multiModelResults,
  isGenerating,
  onClearResults
}) => {
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});

  const hasModels = selectedModels && selectedModels.length > 0;
  const hasResults = requestStates && Object.keys(requestStates).length > 0;
  
  const toggleExpanded = (model: string) => {
    setExpandedModels(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  if (!hasModels && !hasResults) {
    return (
      <div className="container">
        <div className="section">
          <div className="header">
            <h2>Requests</h2>
          </div>
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No requests in progress. Start a generation from the generator page to see progress here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section">
        <div className="header">
          <h2>{isGenerating ? 'Requests in Progress' : 'Request History'}</h2>
        </div>

        <div className="model-status" style={{ padding: '15px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
            {isGenerating 
              ? `Generating for ${selectedModels.length} model(s)...`
              : `${selectedModels.length} request(s)`
            }
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedModels.map(model => {
              const status = requestStates[model];
              const isActive = activeModels.includes(model) || status?.status === 'pending';
              const resultItem = multiModelResults[model];
              const isExpanded = expandedModels[model];
              
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

              // Validate response format if completed/failed
              let validationResult = null;
              if ((status?.status === 'completed' || status?.status === 'failed') && resultItem?.data) {
                validationResult = validateScreenplayFormat(resultItem.data);
              }

              return (
                <div key={model}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#fafafa',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${statusColor}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => (status?.status === 'completed' || status?.status === 'failed') && toggleExpanded(model)}
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
                        Duration: {elapsedTime}
                      </div>
                      
                      {/* Status indicator before expansion */}
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        {status?.status === 'completed' && validationResult && (
                          <span style={{ 
                            padding: '2px 6px',
                            borderRadius: '2px',
                            backgroundColor: validationResult.valid ? '#d4edda' : '#f8d7da',
                            color: validationResult.valid ? '#155724' : '#721c24'
                          }}>
                            {validationResult.valid ? '✓ Valid format' : '⚠ Invalid format'}
                          </span>
                        )}
                        
                        {(resultItem?.error || status?.error) && (
                          <div style={{ color: '#dc3545', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={resultItem?.error || status?.error}>
                            Error: {resultItem?.error || status?.error}
                          </div>
                        )}
                      </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
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
                        title="Cancel this request"
                      >
                        Cancel
                      </button>
                    )}

                    {(status?.status === 'completed' || status?.status === 'failed') && (
                      <span style={{ 
                        fontSize: '14px', 
                        flexShrink: 0,
                        transition: 'transform 0.2s'
                      }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (status?.status === 'completed' || status?.status === 'failed') && (
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${statusColor}`
                    }}>
                      {/* HTTP Status Code and Response Metadata */}
                      {status?.statusCode && (
                        <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                          <strong>HTTP Status:</strong> {status.statusCode}
                        </div>
                      )}

                      {/* Validation errors if format is invalid */}
                      {validationResult && !validationResult.valid && (
                        <div style={{
                          marginBottom: '12px',
                          padding: '8px',
                          backgroundColor: '#f8d7da',
                          borderRadius: '3px',
                          fontSize: '12px',
                          color: '#721c24'
                        }}>
                          <strong>Format Validation Errors:</strong>
                          <ul style={{ margin: '6px 0 0 20px', paddingLeft: 0 }}>
                            {validationResult.errors.map((err, idx) => (
                              <li key={idx} style={{ marginTop: '4px' }}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Response body */}
                      {resultItem?.data && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>Response Body:</strong>
                          <pre style={{
                            backgroundColor: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            padding: '8px',
                            fontSize: '11px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            margin: 0
                          }}>
                            {JSON.stringify(resultItem.data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Error response */}
                      {status?.error && !resultItem?.data && (
                        <div style={{
                          marginBottom: '12px',
                          padding: '8px',
                          backgroundColor: '#f8d7da',
                          borderRadius: '3px',
                          fontSize: '12px',
                          color: '#721c24'
                        }}>
                          <strong>Error Details:</strong>
                          <pre style={{
                            backgroundColor: '#fff',
                            border: '1px solid #dc3545',
                            borderRadius: '3px',
                            padding: '8px',
                            fontSize: '11px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            margin: '6px 0 0 0'
                          }}>
                            {status.error}
                          </pre>
                        </div>
                      )}
                    </div>
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
                In Progress: {activeModels.length} | 
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
};

export default ScreenplayRequests;

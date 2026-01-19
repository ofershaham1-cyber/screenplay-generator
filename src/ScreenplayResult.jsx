import { useState, useEffect } from 'react';
import ScreenplayView from './ScreenplayView';
import { useScreenplayHistory } from './useScreenplayHistory';
import { useScreenplay } from './useScreenplay';

export default function ScreenplayResult() {
  const { history } = useScreenplayHistory();
  const { multiModelResults } = useScreenplay();
  const [screenplay, setScreenplay] = useState(null);
  const [generatingParams, setGeneratingParams] = useState(null);
  const [showMultiModelResults, setShowMultiModelResults] = useState(false);

  useEffect(() => {
    if (history.length) {
      const lastScreenplay = history[history.length - 1];
      if (lastScreenplay && lastScreenplay.screenplay) {
        setScreenplay(lastScreenplay.screenplay);
        setGeneratingParams(lastScreenplay.params);
      }
    }
  }, [history]);

  if (!screenplay) {
    return (
      <div className="container">
        <div className="section" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2>No Screenplay Generated</h2>
          <p>Generate a screenplay from the Generator page to view results here.</p>
        </div>
      </div>
    );
  }

  const hasMultiModelResults = multiModelResults && Object.keys(multiModelResults).length > 0;

  return (
    <div className="container">
      {generatingParams && (
        <div className="section generation-info">
          <h3>Generation Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
            {generatingParams.story_pitch && (
              <div>
                <strong>Story Pitch:</strong>
                <p>{generatingParams.story_pitch}</p>
              </div>
            )}
            {generatingParams.dialog_languages && (
              <div>
                <strong>Languages:</strong>
                <p>{generatingParams.dialog_languages.join(', ')}</p>
              </div>
            )}
            {generatingParams.default_screenplay_language && (
              <div>
                <strong>Default Language:</strong>
                <p>{generatingParams.default_screenplay_language}</p>
              </div>
            )}
            {generatingParams.model && (
              <div>
                <strong>Model:</strong>
                <p>{generatingParams.model}</p>
              </div>
            )}
            {generatingParams.models && generatingParams.models.length > 0 && (
              <div>
                <strong>Models:</strong>
                <p>{generatingParams.models.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasMultiModelResults && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Multi-Model Results</h3>
            <button onClick={() => setShowMultiModelResults(!showMultiModelResults)}>
              {showMultiModelResults ? 'Hide Results' : 'Show Results'}
            </button>
          </div>
          
          {showMultiModelResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.entries(multiModelResults).map(([model, result]) => (
                <div key={model} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px',
                  backgroundColor: result.success ? '#f0fff4' : '#fff0f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px' }}>{model}</strong>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      backgroundColor: result.success ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}>
                      {result.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  {result.error && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
                      Error: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ScreenplayView screenplay={screenplay} />
    </div>
  );
}

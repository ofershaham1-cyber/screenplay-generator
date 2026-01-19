import { useState, useEffect } from 'react';
import ScreenplayView from './ScreenplayView';
import { useScreenplayHistory } from './useScreenplayHistory';

export default function ScreenplayResult() {
  const { history } = useScreenplayHistory();
  const [screenplay, setScreenplay] = useState(null);
  const [generatingParams, setGeneratingParams] = useState(null);

  useEffect(() => {
    if (history.length) {
      const lastScreenplay = history[history.length - 1];
      setScreenplay(lastScreenplay.screenplay);
      setGeneratingParams(lastScreenplay.params);
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
          </div>
        </div>
      )}
      <ScreenplayView screenplay={screenplay} />
    </div>
  );
}

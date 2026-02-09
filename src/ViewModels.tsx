import { useState, useEffect } from 'react';
import './ScreenplayView.css';

export default function ViewModels() {
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Load models from API
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error('Failed to load models');
        const data = await response.json();
        setModels(data);
      } catch (err) {
        console.error('Error loading models:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const allKeys = {};
    const collectKeys = (obj, prefix = '') => {
      if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([k, v]) => {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          allKeys[fullKey] = true;
          collectKeys(v, fullKey);
        });
      }
    };
    collectKeys(models);
    setExpandedSections(allKeys);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const renderValue = (value, key = '') => {
    if (value === null || value === undefined) return <span className="null-value">null</span>;

    if (Array.isArray(value)) {
      const isExpanded = expandedSections[key];
      return (
        <div className="json-array">
          <button className="toggle-btn" onClick={() => toggleSection(key)}>
            {isExpanded ? '[-]' : '[+]'} Array ({value.length} items)
          </button>
          {isExpanded && (
            <div className="json-content">
              {value.map((item, idx) => (
                <div key={idx} className="json-item">
                  <strong>[{idx}]:</strong> {renderValue(item, `${key}.${idx}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedSections[key];
      return (
        <div className="json-object">
          <button className="toggle-btn" onClick={() => toggleSection(key)}>
            {isExpanded ? '[-]' : '[+]'} Object ({Object.keys(value).length} keys)
          </button>
          {isExpanded && (
            <div className="json-content">
              {Object.entries(value).map(([k, v]) => (
                <div key={k} className="json-property">
                  <strong>{k}:</strong> {renderValue(v, `${key}.${k}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="json-value">{String(value)}</span>;
  };

  return (
    <div className="container">
      <div className="content">
        <h2>View Models</h2>
        
        {loading && <p>Loading models...</p>}
        
        {error && (
          <div className="error">
            Failed to load models: {error}
          </div>
        )}
        
        {models && (
          <div className="form-group">
            <div className="expand-buttons">
              <button onClick={expandAll} className="expand-btn">
                Expand All
              </button>
              <button onClick={collapseAll} className="collapse-btn">
                Collapse All
              </button>
            </div>
            <div className="format-display">
              {renderValue(models, 'models')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

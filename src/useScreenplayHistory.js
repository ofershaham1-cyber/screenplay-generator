import { useState, useEffect, useRef, useCallback } from 'react';

const HISTORY_KEY = 'screenplay_history';
const MAX_HISTORY = 20;

export const useScreenplayHistory = () => {
  const [history, setHistory] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0 });
  const hasLoaded = useRef(false);

  // Load history from localStorage on mount
  useEffect(() => {
    if (hasLoaded.current) return; // Prevent loading twice
    
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        const historyArray = Array.isArray(parsed) ? parsed : [];
        setHistory(historyArray);
        console.log(`✓ Loaded ${historyArray.length} screenplays from localStorage`);
      } else {
        console.log('ℹ️ No screenplay history in localStorage yet');
      }
    } catch (err) {
      console.error('Failed to parse screenplay history from localStorage:', err);
      setHistory([]);
      // Clear corrupted data
      localStorage.removeItem(HISTORY_KEY);
    }
    
    // Calculate storage usage
    calculateStorageUsage();
    hasLoaded.current = true;
  }, []);

  const calculateStorageUsage = useCallback(() => {
    try {
      const data = localStorage.getItem(HISTORY_KEY) || '';
      const used = (data.length / 1024).toFixed(2);
      const available = ((5 * 1024 - data.length) / 1024).toFixed(2);
      setStorageInfo({ used: parseFloat(used), available: parseFloat(available) });
    } catch (err) {
      console.error('Failed to calculate storage usage:', err);
    }
  }, []);

  // Save history to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (!hasLoaded.current) return; // Don't save until we've loaded
    
    try {
      const serialized = JSON.stringify(history);
      localStorage.setItem(HISTORY_KEY, serialized);
      console.log(`✓ Saved ${history.length} screenplays to localStorage (${(serialized.length / 1024).toFixed(2)}KB)`);
      calculateStorageUsage();
    } catch (err) {
      console.error('Failed to save screenplay history to localStorage:', err);
      if (err.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage quota exceeded. Consider clearing old screenplays.');
      }
    }
  }, [history, calculateStorageUsage]);

  const addToHistory = (screenplay, params = {}) => {
    try {
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        screenplay,
        params: {
          story_pitch: params.story_pitch || '',
          dialog_languages: params.dialog_languages || [],
          default_screenplay_language: params.default_screenplay_language || '',
          model: params.model || '',
        },
      };

      setHistory(prev => {
        const updated = [historyItem, ...prev.slice(0, MAX_HISTORY - 1)];
        console.log(`✓ Added screenplay to history. Total: ${updated.length}`);
        return updated;
      });
    } catch (err) {
      console.error('Failed to add screenplay to history:', err);
    }
  };

  const removeFromHistory = (id) => {
    try {
      setHistory(prev => {
        const updated = prev.filter(item => item.id !== id);
        console.log(`✓ Removed screenplay from history. Total: ${updated.length}`);
        return updated;
      });
    } catch (err) {
      console.error('Failed to remove screenplay from history:', err);
    }
  };

  const clearHistory = () => {
    try {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
      console.log('✓ Cleared all screenplays from history');
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const getHistoryItem = (id) => {
    return history.find(item => item.id === id);
  };

  const exportScreenplay = (id) => {
    try {
      const item = getHistoryItem(id);
      if (!item) {
        console.warn('Screenplay not found');
        return null;
      }
      
      const exportData = {
        ...item,
        exportedAt: new Date().toISOString(),
      };
      
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `screenplay-${item.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log('✓ Screenplay exported');
      return exportData;
    } catch (err) {
      console.error('Failed to export screenplay:', err);
      return null;
    }
  };

  const importScreenplay = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.screenplay && data.params) {
              addToHistory(data.screenplay, data.params);
              console.log('✓ Screenplay imported successfully');
              resolve(data);
            } else {
              reject(new Error('Invalid screenplay file format'));
            }
          } catch (err) {
            reject(new Error('Failed to parse screenplay file: ' + err.message));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  const getStorageStats = () => {
    return {
      totalScreenplays: history.length,
      oldestScreenplay: history.length > 0 ? history[history.length - 1].timestamp : null,
      newestScreenplay: history.length > 0 ? history[0].timestamp : null,
      storageUsed: storageInfo.used,
      storageAvailable: storageInfo.available,
    };
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryItem,
    exportScreenplay,
    importScreenplay,
    getStorageStats,
    storageInfo,
  };
};

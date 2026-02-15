import { useState, useEffect, useRef, useCallback } from 'react';

const HISTORY_KEY = 'screenplay_history';
const MAX_HISTORY = 20;

export interface ScreenplayHistoryItem {
  id: string;
  timestamp: string;
  screenplay: unknown;
  params: {
    story_pitch?: string;
    dialog_languages?: string[];
    default_screenplay_language?: string;
    model?: string;
    generationType?: string;
  };
}

export interface StorageInfo {
  used: number;
  available: number;
}

export interface ScreenplayStats {
  totalScreenplays: number;
  oldestScreenplay: string | null;
  newestScreenplay: string | null;
  storageUsed: number;
  storageAvailable: number;
}

export const useScreenplayHistory = () => {
  const [history, setHistory] = useState<ScreenplayHistoryItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ used: 0, available: 0 });
  const hasLoaded = useRef(false);
  const idCounterRef = useRef(0);

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
      const used = parseFloat((data.length / 1024).toFixed(2));
      const available = parseFloat(((5 * 1024 - data.length) / 1024).toFixed(2));
      setStorageInfo({ used, available });
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
      if ((err as any).name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage quota exceeded. Consider clearing old screenplays.');
      }
    }
  }, [history, calculateStorageUsage]);

  const addToHistory = (screenplay: unknown, params: Partial<ScreenplayHistoryItem['params']> = {}) => {
    try {
      const historyItem: ScreenplayHistoryItem = {
        id: `${Date.now()}-${++idCounterRef.current}`,
        timestamp: new Date().toISOString(),
        screenplay,
        params: {
          story_pitch: params.story_pitch || '',
          dialog_languages: params.dialog_languages || [],
          default_screenplay_language: params.default_screenplay_language || '',
          model: params.model || '',
          generationType: params.generationType || 'screenplay',
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

  const removeFromHistory = (id: string) => {
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

  const getHistoryItem = (id: string): ScreenplayHistoryItem | undefined => {
    return history.find(item => item.id === id);
  };

  const exportScreenplay = (id: string) => {
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

  const importScreenplay = (file: File): Promise<ScreenplayHistoryItem> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.screenplay && data.params) {
              addToHistory(data.screenplay, data.params);
              console.log('✓ Screenplay imported successfully');
              resolve(data);
            } else {
              reject(new Error('Invalid screenplay file format'));
            }
          } catch (err) {
            reject(new Error('Failed to parse screenplay file: ' + (err as Error).message));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  const getStorageStats = (): ScreenplayStats => {
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

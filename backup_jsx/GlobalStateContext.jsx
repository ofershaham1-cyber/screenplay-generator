import React, { createContext, useContext, useReducer, useCallback } from 'react';

const GlobalStateContext = createContext();

// Initial state
const initialState = {
  history: [],
  screenplayResults: [], // Array to store all screenplay responses
};

// Reducer
const globalReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        history: [action.payload, ...state.history],
        screenplayResults: [...state.screenplayResults, action.payload],
      };
    case 'REMOVE_FROM_HISTORY':
      return {
        ...state,
        history: state.history.filter(item => item.id !== action.payload),
        screenplayResults: state.screenplayResults.filter(item => item.id !== action.payload),
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
        screenplayResults: [],
      };
    case 'ADD_SCREENPLAY_RESULT':
      return {
        ...state,
        screenplayResults: [...state.screenplayResults, action.payload],
      };
    default:
      return state;
  }
};

// Provider component
export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  const addToHistory = useCallback((screenplay, params) => {
    const historyItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      screenplay,
      params,
    };
    dispatch({ type: 'ADD_TO_HISTORY', payload: historyItem });
    return historyItem.id;
  }, []);

  const removeFromHistory = useCallback((id) => {
    dispatch({ type: 'REMOVE_FROM_HISTORY', payload: id });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const addScreenplayResult = useCallback((screenplay, params) => {
    const resultItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      screenplay,
      params,
    };
    dispatch({ type: 'ADD_SCREENPLAY_RESULT', payload: resultItem });
    return resultItem.id;
  }, []);

  const value = {
    history: state.history,
    screenplayResults: state.screenplayResults,
    addToHistory,
    removeFromHistory,
    clearHistory,
    addScreenplayResult,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Custom hook to use global state
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

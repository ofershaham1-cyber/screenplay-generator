import { createStore, combineReducers } from 'react';

// Simple Redux-like store implementation
const createStore = (reducer, initialState = {}) => {
  let state = initialState;
  let listeners = [];

  const getState = () => state;

  const dispatch = (action) => {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  return { getState, dispatch, subscribe };
};

// History reducer
const historyReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TO_HISTORY':
      return [action.payload, ...state];
    case 'REMOVE_FROM_HISTORY':
      return state.filter(item => item.id !== action.payload);
    case 'CLEAR_HISTORY':
      return [];
    default:
      return state;
  }
};

// Combine reducers
const rootReducer = combineReducers({
  history: historyReducer,
});

// Create store
export const store = createStore(rootReducer, {
  history: [],
});

// Actions
export const addToHistory = (screenplay, params) => ({
  type: 'ADD_TO_HISTORY',
  payload: {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    screenplay,
    params,
  },
});

export const removeFromHistory = (id) => ({
  type: 'REMOVE_FROM_HISTORY',
  payload: id,
});

export const clearHistory = () => ({
  type: 'CLEAR_HISTORY',
});

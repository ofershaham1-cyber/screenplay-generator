interface StoreAction {
  type: string;
  payload?: unknown;
}

interface StoreListener {
  (): void;
}

interface Store<T> {
  getState: () => T;
  dispatch: (action: StoreAction) => void;
  subscribe: (listener: StoreListener) => () => void;
}

// Simple Redux-like store implementation
export const createStore = <T,>(reducer: (state: unknown, action: StoreAction) => unknown, initialState: T): Store<T> => {
  let state = initialState;
  let listeners: StoreListener[] = [];

  const getState = (): T => state;

  const dispatch = (action: StoreAction): void => {
    state = reducer(state, action) as T;
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener: StoreListener): (() => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  return { getState, dispatch, subscribe };
};

// History reducer
interface HistoryItem {
  id: string;
  timestamp: string;
  screenplay: unknown;
  params: unknown;
}

const historyReducer = (state: HistoryItem[] = [], action: StoreAction): HistoryItem[] => {
  switch (action.type) {
    case 'ADD_TO_HISTORY':
      return [action.payload as HistoryItem, ...state];
    case 'REMOVE_FROM_HISTORY':
      return state.filter(item => item.id !== action.payload);
    case 'CLEAR_HISTORY':
      return [];
    default:
      return state;
  }
};

// Combine reducers
interface RootState {
  history: HistoryItem[];
}

const combineReducers = (reducers: Record<string, (state: unknown, action: StoreAction) => unknown>) => {
  return (state: RootState = { history: [] }, action: StoreAction): RootState => {
    const newState: RootState = { history: [] };
    for (const key in reducers) {
      newState[key as keyof RootState] = reducers[key](state[key as keyof RootState], action) as any;
    }
    return newState;
  };
};

const rootReducer = combineReducers({
  history: historyReducer as (state: unknown, action: StoreAction) => unknown,
});

// Create store
export const store = createStore(rootReducer as any, {
  history: [],
});

// Actions
export const addToHistory = (screenplay: unknown, params: unknown): StoreAction => ({
  type: 'ADD_TO_HISTORY',
  payload: {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    screenplay,
    params,
  },
});

export const removeFromHistory = (id: string): StoreAction => ({
  type: 'REMOVE_FROM_HISTORY',
  payload: id,
});

export const clearHistory = (): StoreAction => ({
  type: 'CLEAR_HISTORY',
});

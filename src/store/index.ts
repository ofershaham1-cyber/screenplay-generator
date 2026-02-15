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

// Request state interface
export interface RequestState {
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string | null;
  cancelled?: boolean;
}

// Requests reducer
const requestsReducer = (state: Record<string, RequestState> = {}, action: StoreAction): Record<string, RequestState> => {
  switch (action.type) {
    case 'REGISTER_REQUEST':
      const { model, startTime } = action.payload as { model: string; startTime: number };
      return {
        ...state,
        [model]: {
          status: 'pending',
          startTime,
          error: null,
          cancelled: false
        }
      };
    case 'COMPLETE_REQUEST':
      const { model: completeModel, success, error, endTime } = action.payload as { 
        model: string; 
        success: boolean; 
        error?: string | null; 
        endTime: number 
      };
      const existingState = state[completeModel] || {};
      return {
        ...state,
        [completeModel]: {
          ...existingState,
          status: success ? 'completed' : 'failed',
          error: error || null,
          endTime,
          duration: endTime - (existingState.startTime || endTime)
        }
      };
    case 'CANCEL_REQUEST':
      const { model: cancelModel, endTime: cancelEndTime } = action.payload as { 
        model: string; 
        endTime: number 
      };
      const cancelState = state[cancelModel] || {};
      return {
        ...state,
        [cancelModel]: {
          ...cancelState,
          status: 'cancelled',
          cancelled: true,
          endTime: cancelEndTime,
          duration: cancelEndTime - (cancelState.startTime || cancelEndTime)
        }
      };
    case 'CLEAR_REQUESTS':
      return {};
    default:
      return state;
  }
};

// Combine reducers
interface RootState {
  history: HistoryItem[];
  requests: Record<string, RequestState>;
}

const combineReducers = (reducers: Record<string, (state: unknown, action: StoreAction) => unknown>) => {
  return (state: RootState = { history: [], requests: {} }, action: StoreAction): RootState => {
    const newState: RootState = { history: [], requests: {} };
    for (const key in reducers) {
      newState[key as keyof RootState] = reducers[key](state[key as keyof RootState], action) as any;
    }
    return newState;
  };
};

const rootReducer = combineReducers({
  history: historyReducer as (state: unknown, action: StoreAction) => unknown,
  requests: requestsReducer as (state: unknown, action: StoreAction) => unknown,
});

// Create store
export const store = createStore(rootReducer as any, {
  history: [],
  requests: {},
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

// Request actions
export const registerRequest = (model: string): StoreAction => ({
  type: 'REGISTER_REQUEST',
  payload: { model, startTime: Date.now() },
});

export const completeRequest = (model: string, success: boolean = true, error: string | null = null): StoreAction => ({
  type: 'COMPLETE_REQUEST',
  payload: { model, success, error, endTime: Date.now() },
});

export const cancelRequest = (model: string): StoreAction => ({
  type: 'CANCEL_REQUEST',
  payload: { model, endTime: Date.now() },
});

export const clearRequests = (): StoreAction => ({
  type: 'CLEAR_REQUESTS',
});

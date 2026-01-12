// Context principal de l'application CleanHouse
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { PaymentMethod } from '../types';

// State type
interface AppState {
  // UI State
  isLoading: boolean;
  error: string | null;

  // Payment methods
  paymentMethods: PaymentMethod[];

  // Modals
  activeModal: string | null;

  // Theme
  isDarkMode: boolean;
}

// Actions
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'REMOVE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'SET_ACTIVE_MODAL'; payload: string | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  isLoading: false,
  error: null,
  paymentMethods: [],
  activeModal: null,
  isDarkMode: false,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: [...state.paymentMethods, action.payload],
      };
    case 'REMOVE_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: state.paymentMethods.filter(
          (pm) => pm.id !== action.payload
        ),
      };
    case 'SET_PAYMENT_METHODS':
      return { ...state, paymentMethods: action.payload };
    case 'SET_ACTIVE_MODAL':
      return { ...state, activeModal: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

// Context type
interface AppContextType extends AppState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  openModal: (modalName: string) => void;
  closeModal: () => void;
  toggleDarkMode: () => void;
  resetState: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const addPaymentMethod = (method: PaymentMethod) => {
    dispatch({ type: 'ADD_PAYMENT_METHOD', payload: method });
  };

  const removePaymentMethod = (id: string) => {
    dispatch({ type: 'REMOVE_PAYMENT_METHOD', payload: id });
  };

  const setPaymentMethods = (methods: PaymentMethod[]) => {
    dispatch({ type: 'SET_PAYMENT_METHODS', payload: methods });
  };

  const openModal = (modalName: string) => {
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: modalName });
  };

  const closeModal = () => {
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: null });
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setLoading,
        setError,
        addPaymentMethod,
        removePaymentMethod,
        setPaymentMethods,
        openModal,
        closeModal,
        toggleDarkMode,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

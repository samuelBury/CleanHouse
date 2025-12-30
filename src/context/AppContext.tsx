// Context principal de l'application CleanHouse
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { WalletData, PaymentMethod, Transaction } from '../types';

// State type
interface AppState {
  // UI State
  isLoading: boolean;
  error: string | null;

  // Wallet
  wallet: WalletData | null;

  // Modals
  activeModal: string | null;

  // Theme
  isDarkMode: boolean;
}

// Actions
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WALLET'; payload: WalletData }
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'REMOVE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_ACTIVE_MODAL'; payload: string | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  isLoading: false,
  error: null,
  wallet: null,
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
    case 'SET_WALLET':
      return { ...state, wallet: action.payload };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        wallet: state.wallet
          ? { ...state.wallet, balance: action.payload }
          : null,
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        wallet: state.wallet
          ? {
              ...state.wallet,
              transactions: [action.payload, ...state.wallet.transactions],
            }
          : null,
      };
    case 'ADD_PAYMENT_METHOD':
      return {
        ...state,
        wallet: state.wallet
          ? {
              ...state.wallet,
              paymentMethods: [...state.wallet.paymentMethods, action.payload],
            }
          : null,
      };
    case 'REMOVE_PAYMENT_METHOD':
      return {
        ...state,
        wallet: state.wallet
          ? {
              ...state.wallet,
              paymentMethods: state.wallet.paymentMethods.filter(
                (pm) => pm.id !== action.payload
              ),
            }
          : null,
      };
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
  setWallet: (wallet: WalletData) => void;
  updateBalance: (balance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
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

  const setWallet = (wallet: WalletData) => {
    dispatch({ type: 'SET_WALLET', payload: wallet });
  };

  const updateBalance = (balance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
  };

  const addTransaction = (transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  };

  const addPaymentMethod = (method: PaymentMethod) => {
    dispatch({ type: 'ADD_PAYMENT_METHOD', payload: method });
  };

  const removePaymentMethod = (id: string) => {
    dispatch({ type: 'REMOVE_PAYMENT_METHOD', payload: id });
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
        setWallet,
        updateBalance,
        addTransaction,
        addPaymentMethod,
        removePaymentMethod,
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

// Context d'authentification pour CleanHouse
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, LoginCredentials, RegisterCredentials, AuthState } from '../types';

// Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Context type
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (identityToken: string, fullName?: { givenName?: string; familyName?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    dispatch({ type: 'AUTH_START' });
    const result = await authService.checkAuth();
    if (result.isAuthenticated && result.user) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: result.user, token: '' }, // Token is in storage
      });
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: '' });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    const result = await authService.login(credentials);
    if (result.success && result.data) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: result.data.user, token: result.data.token },
      });
      return { success: true };
    }
    dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Login failed' });
    return { success: false, error: result.error };
  };

  const register = async (credentials: RegisterCredentials) => {
    // Ne pas dispatcher AUTH_START pour éviter le remount du navigateur
    const result = await authService.register(credentials);

    // Si l'inscription nécessite une vérification email, ne pas connecter
    if (result.success && result.requiresVerification) {
      return { success: true, requiresVerification: true };
    }

    // Sinon, connecter normalement (si l'email est déjà vérifié)
    if (result.success && result.data?.token) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: result.data.user, token: result.data.token },
      });
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const loginWithGoogle = async (idToken: string) => {
    dispatch({ type: 'AUTH_START' });
    const result = await authService.loginWithGoogle(idToken);
    if (result.success && result.data) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: result.data.user, token: result.data.token },
      });
      return { success: true };
    }
    dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Google login failed' });
    return { success: false, error: result.error };
  };

  const loginWithApple = async (identityToken: string, fullName?: { givenName?: string; familyName?: string }) => {
    dispatch({ type: 'AUTH_START' });
    const result = await authService.loginWithApple(identityToken, fullName);
    if (result.success && result.data) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: result.data.user, token: result.data.token },
      });
      return { success: true };
    }
    dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Apple login failed' });
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

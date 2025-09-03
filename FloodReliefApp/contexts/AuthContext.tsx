import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { authAPI, setAuthToken, getAuthToken, removeAuthToken } from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: any; // Replace with your user type
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: any; token: string } }
  | { type: 'UPDATE_USER'; payload: { user: any } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false, // Temporarily set to false for testing
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, phone?: string, address?: string, emergency_contact?: string) => Promise<void>;
  updateProfile?: (profileData: any) => Promise<void>;
  logout: () => Promise<void>;
} | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app start
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     console.log('Checking auth...');
  //     try {
  //       const token = await getAuthToken();
  //       console.log('Token found:', !!token);
  //       if (token) {
  //         try {
  //           // Verify token by fetching user
  //           console.log('Verifying token...');
  //           const user = await authAPI.getUser();
  //           console.log('Token valid, user:', user);
  //           dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
  //         } catch (error) {
  //           // Token invalid or API unavailable, remove it
  //           console.log('Token verification failed:', error);
  //           await removeAuthToken();
  //           dispatch({ type: 'SET_LOADING', payload: false });
  //         }
  //       } else {
  //         console.log('No token found, showing login');
  //         dispatch({ type: 'SET_LOADING', payload: false });
  //       }
  //     } catch (error) {
  //       // Error getting token from storage
  //       console.log('Error checking auth token:', error);
  //       dispatch({ type: 'SET_LOADING', payload: false });
  //     }
  //   };
  //   checkAuth();
  // }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response;
      await setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string, phone?: string, address?: string, emergency_contact?: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.register(email, password, password, name, phone, address, emergency_contact);
      const { user, token } = response;
      await setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout fails, clear local state
    }
    await removeAuthToken();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const { user } = response;
      dispatch({ type: 'UPDATE_USER', payload: { user } });
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

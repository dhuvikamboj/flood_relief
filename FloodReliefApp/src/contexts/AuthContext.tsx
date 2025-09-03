import React, { createContext, useContext, ReactNode } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import store, { RootState, AppDispatch } from '../store';
import { login as loginThunk, register as registerThunk, logoutLocal, updateProfile as updateProfileThunk } from '../store/slices/authSlice';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name?: string, confirmPassword?: string) => Promise<any>;
  updateProfile: (profileData: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </Provider>
  );
};

const InnerAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = async (email: string, password: string) => {
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.rejected.match(result)) throw result.payload || result.error;
    return result.payload;
  };

  const register = async (email: string, password: string, name?: string, confirmPassword?: string, phone?: string, address?: string, emergencyContact?: string) => {
    const result = await dispatch(registerThunk({ email, password, name, confirmPassword, phone, address, emergencyContact }));
    if (registerThunk.rejected.match(result)) throw result.payload || result.error;
    return result.payload;
  };

  const updateProfile = async (profileData: any) => {
    const result = await dispatch(updateProfileThunk(profileData));
    if (updateProfileThunk.rejected.match(result)) throw result.payload || result.error;
    return result.payload.user;
  };

  const logout = () => {
    dispatch(logoutLocal());
  };

  const value: AuthContextType = {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.loading,
    token: auth.token,
    login,
    register,
  updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

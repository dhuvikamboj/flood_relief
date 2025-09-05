import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  token: string | null;
}

const API_BASE_URL = 'https://floodrelief.davindersingh.dev/api';

const initialFromStorage = (): AuthState => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { isAuthenticated: false, user: null, loading: false, token: null };
    }
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      const user = JSON.parse(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { isAuthenticated: true, user, loading: false, token };
    }
  } catch (e) {
    console.error('auth slice init error', e);
  }
  return { isAuthenticated: false, user: null, loading: false, token: null };
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string; name?: string; confirmPassword?: string; phone?: string; address?: string; emergencyContact?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        email: payload.email,
        password: payload.password,
        name: payload.name,
        password_confirmation: payload.confirmPassword,
        phone: payload.phone,
        address: payload.address,
        emergency_contact: payload.emergencyContact,
      });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/user`, profileData);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const slice = createSlice({
  name: 'auth',
  initialState: initialFromStorage(),
  reducers: {
    logoutLocal(state) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      delete axios.defaults.headers.common['Authorization'];
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        // state.loading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        const { token, user } = action.payload;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        state.isAuthenticated = true;
        state.user = user;
        state.token = token;
        state.loading = false;
      })
      .addCase(login.rejected, state => {
        state.loading = false;
      })
      .addCase(register.pending, state => {
        // state.loading = true;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<any>) => {
        const { token, user } = action.payload;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        state.isAuthenticated = true;
        state.user = user;
        state.token = token;
        state.loading = false;
      })
      .addCase(register.rejected, state => {
        state.loading = false;
      });
    builder
        .addCase(updateProfile.pending, state => {
          // state.loading = true;
        })
        .addCase(updateProfile.fulfilled, (state, action: PayloadAction<any>) => {
          // payload can be either the user object or an object like { user: {...} }
          const payload = action.payload;
          const user = payload && payload.user ? payload.user : payload;
          // Keep token intact, just update user
          try {
            localStorage.setItem('user_data', JSON.stringify(user));
          } catch (e) {
            console.error('Failed to persist user_data', e);
          }
          state.user = user;
          state.loading = false;
        })
      .addCase(updateProfile.rejected, state => {
        state.loading = false;
      });
  },
});

export const { logoutLocal } = slice.actions;

export default slice.reducer;

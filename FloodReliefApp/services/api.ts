import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import secureStorage from './secureStorage';
import { getApiUrl } from '../src/config/api';

// Base URL for your Laravel API
// For development, use your computer's IP address instead of localhost
// You can find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_BASE_URL = getApiUrl();  // For production

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const token = await secureStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh or logout on 401
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosError> => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await secureStorage.removeItem('auth_token');
      // You might want to dispatch logout action here
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API functions
export const authAPI = {
  login: async (email: string, password: string): Promise<any> => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  register: async (
    email: string,
    password: string,
    password_confirmation: string,
    name?: string,
    phone?: string,
    address?: string,
    emergency_contact?: string
  ): Promise<any> => {
    const response = await api.post('/register', {
      email,
      password,
      password_confirmation,
      name,
      phone,
      address,
      emergency_contact,
    });
    return response.data;
  },

  logout: async (): Promise<any> => {
    const response = await api.post('/logout');
    return response.data;
  },

  getUser: async (): Promise<any> => {
    const response = await api.get('/user');
    return response.data;
  },

  updateProfile: async (profileData: any): Promise<any> => {
    const response = await api.put('/user', profileData);
    return response.data;
  },
};

// Reports API functions
export const reportsAPI = {
  getReports: async (): Promise<any> => {
    const response = await api.get('/reports');
    return response.data;
  },

  createReport: async (reportData: any): Promise<any> => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  getReport: async (id: number): Promise<any> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
};

// Emergency contacts API
export const contactsAPI = {
  getContacts: async (): Promise<any> => {
    const response = await api.get('/emergency-contacts');
    return response.data;
  },
};

// Utility functions
export const setAuthToken = async (token: string): Promise<void> => {
  await secureStorage.setItem('auth_token', token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await secureStorage.getItem('auth_token');
};

export const removeAuthToken = async (): Promise<void> => {
  await secureStorage.removeItem('auth_token');
};

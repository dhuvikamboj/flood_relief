/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Base API URL - can be overridden by environment variable
export const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';

// API endpoints
export const API_ENDPOINTS = {
  // Base URL with /api suffix for most endpoints
  API: `${API_BASE_URL}/api`,
  
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/login`,
  REGISTER: `${API_BASE_URL}/api/register`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  USER: `${API_BASE_URL}/api/user`,
  
  // Request endpoints
  REQUESTS: `${API_BASE_URL}/api/requests`,
  USER_REQUESTS: `${API_BASE_URL}/api/user/requests`,
  
  // Resource endpoints
  RESOURCES: `${API_BASE_URL}/api/resources`,
  
  // Comments endpoints
  COMMENTS: (resourceId: number) => `${API_BASE_URL}/api/resources/${resourceId}/comments`,
  
  // Other endpoints can be added here as needed
} as const;

/**
 * Get the base API URL without any suffix
 */
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};

/**
 * Get the base API URL with /api suffix
 */
export const getApiUrl = (): string => {
  return API_ENDPOINTS.API;
};

/**
 * Helper function to construct API URLs
 */
export const buildApiUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

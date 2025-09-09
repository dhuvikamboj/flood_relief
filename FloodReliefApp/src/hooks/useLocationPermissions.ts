import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unknown';

export interface LocationPermissionState {
  status: PermissionStatus;
  isLoading: boolean;
  error: string | null;
  hasRequestedOnLaunch: boolean;
}

export interface LocationPermissionHook {
  permissionState: LocationPermissionState;
  requestPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<PermissionStatus>;
}

export const useLocationPermissions = (): LocationPermissionHook => {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>({
    status: 'unknown',
    isLoading: false,
    error: null,
    hasRequestedOnLaunch: false
  });

  const checkPermissions = useCallback(async (): Promise<PermissionStatus> => {
    try {
      // On native platforms, use Capacitor Geolocation
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.checkPermissions();
        
        // Convert Capacitor permission states to our enum
        switch (permissions.location) {
          case 'granted':
            return 'granted';
          case 'denied':
            return 'denied';
          case 'prompt':
          case 'prompt-with-rationale':
            return 'prompt';
          default:
            return 'unknown';
        }
      } else {
        // For web/PWA, check browser permissions API if available
        if ('permissions' in navigator && 'query' in navigator.permissions) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            return result.state as PermissionStatus;
          } catch (e) {
            // Fallback if permissions API query fails
            return 'prompt';
          }
        }
        return 'prompt'; // Default for web
      }
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return 'unknown';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPermissionState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Geolocation for native platforms
        const permissions = await Geolocation.requestPermissions();
        const granted = permissions.location === 'granted';
        
        setPermissionState(prev => ({
          ...prev,
          status: permissions.location === 'granted' ? 'granted' : 
                  permissions.location === 'denied' ? 'denied' : 'prompt',
          isLoading: false,
          hasRequestedOnLaunch: true
        }));
        
        return granted;
      } else {
        // For web, try to trigger permission request by calling getCurrentPosition
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissionState(prev => ({
                ...prev,
                status: 'granted',
                isLoading: false,
                hasRequestedOnLaunch: true
              }));
              resolve(true);
            },
            (error) => {
              const status = error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt';
              setPermissionState(prev => ({
                ...prev,
                status,
                isLoading: false,
                error: error.message,
                hasRequestedOnLaunch: true
              }));
              resolve(false);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000
            }
          );
        });
      }
    } catch (error: any) {
      setPermissionState(prev => ({
        ...prev,
        status: 'denied',
        isLoading: false,
        error: error.message || 'Failed to request location permission',
        hasRequestedOnLaunch: true
      }));
      return false;
    }
  }, []);

  // Check permissions on hook initialization
  useEffect(() => {
    const initializePermissions = async () => {
      const status = await checkPermissions();
      setPermissionState(prev => ({
        ...prev,
        status
      }));
    };

    initializePermissions();
  }, [checkPermissions]);

  return {
    permissionState,
    requestPermission,
    checkPermissions
  };
};

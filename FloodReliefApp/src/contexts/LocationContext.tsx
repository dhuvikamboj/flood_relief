import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface LocationContextType {
  userCoords: LocationCoords | null;
  accuracy: number | null;
  lastUpdated: Date | null;
  mapLoading: boolean;
  mapError: string | null;
  watching: boolean;
  refreshLocation: () => void;
  getCurrentLocation: () => Promise<LocationCoords>;
  clearLocation: () => void;
  setUserCoords: (coords: LocationCoords | null) => void;
  startWatching: () => void;
  stopWatching: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export { LocationContext };

export interface LocationProviderProps {
  children: ReactNode;
  autoWatch?: boolean;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
  autoWatch = true
}) => {
  const [userCoords, setUserCoords] = useState<LocationCoords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  const startLocationWatch = () => {
    if (!('geolocation' in navigator)) {
      setMapError('Geolocation not available in this browser');
      return;
    }

    setMapLoading(true);
    setMapError(null);

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          console.log('📍 Location updated:', pos.coords);
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy ?? null);
          setLastUpdated(new Date());
          setMapLoading(false);
          setMapError(null);
          setWatching(true);
        },
        (err) => {
          console.log('❌ Watch error:', err);
          if (err.code === 3) {
            setMapError('Location timeout. GPS signal may be weak.');
          } else {
            setMapError(err.message || 'Unable to get location');
          }
          setMapLoading(false);
          setWatching(false);
        },
        { 
          enableHighAccuracy: false, // Use network location for faster response
          maximumAge: 30000, // Accept positions up to 30 seconds old
          timeout: 45000 // 45 second timeout for watch
        }
      );
      // @ts-ignore
      watchIdRef.current = id as number;
    } catch (e: any) {
      setMapError(e?.message || 'Failed to start location watch');
      setMapLoading(false);
    }
  };

  // Check permission state for geolocation when Permissions API is available
  const checkPermissionState = async (): Promise<PermissionState | 'unsupported'> => {
    try {
      const perms = (navigator as any).permissions;
      if (!perms || typeof perms.query !== 'function') return 'unsupported';
      // Some browsers may not accept the exact type; cast to any
      const status = await perms.query({ name: 'geolocation' } as any);
      return status.state as PermissionState;
    } catch (e) {
      return 'unsupported';
    }
  };

  // Try to prompt for permission in a user-initiated way and then start watching if granted
  const requestPermissionAndWatch = async () => {
    console.log('🔍 requestPermissionAndWatch called');
    
    if (!('geolocation' in navigator)) {
      console.log('❌ Geolocation not available');
      setMapError('Geolocation not available in this browser');
      return;
    }

    setMapLoading(true);
    setMapError(null);
    console.log('⏳ Starting location request...');

    try {
      // Calling getCurrentPosition will trigger the permission prompt in most browsers
      console.log('📍 Requesting current position...');
      await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('✅ Position obtained:', pos.coords);
            resolve(pos);
          },
          (err) => {
            console.log('❌ Position error:', err);
            reject(err);
          },
          { 
            enableHighAccuracy: false, // Try without high accuracy first
            maximumAge: 60000, // Accept cached positions up to 1 minute old
            timeout: 30000 // Increase timeout to 30 seconds
          }
        )
      );

      // If successful, start the watch to keep updating
      console.log('🎯 Starting location watch...');
      startLocationWatch();
    } catch (err: any) {
      console.log('❌ Permission error:', err);
      
      // If timeout, try again with lower accuracy
      if (err && err.code === 3) {
        console.log('🔄 Timeout occurred, trying with lower accuracy...');
        try {
          await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log('✅ Position obtained (fallback):', pos.coords);
                setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setAccuracy(pos.coords.accuracy ?? null);
                setLastUpdated(new Date());
                setMapLoading(false);
                setMapError(null);
                resolve(pos);
              },
              (fallbackErr) => {
                console.log('❌ Fallback error:', fallbackErr);
                reject(fallbackErr);
              },
              { 
                enableHighAccuracy: false,
                maximumAge: 300000, // Accept positions up to 5 minutes old
                timeout: 60000 // Very long timeout for fallback
              }
            )
          );
          
          // Don't start watching if fallback worked, just use the single position
          return;
          
        } catch (fallbackErr: any) {
          setMapError('Location timeout. Please try again or check your GPS signal.');
          setMapLoading(false);
          return;
        }
      }
      
      // If permission was denied, show actionable guidance
      if (err && err.code === 1) {
        setMapError('Location permission denied. Enable it in your browser settings (iOS: Settings → Safari → Location).');
      } else {
        setMapError(err?.message || 'Unable to get location');
      }
      setMapLoading(false);
    }
  };

  const clearLocation = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    watchIdRef.current = null;
    setWatching(false);
  };

  const refreshLocation = () => {
    clearLocation();
    startLocationWatch();
  };

  const getCurrentLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not available in this browser'));
        return;
      }

      setMapLoading(true);
      setMapError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setAccuracy(pos.coords.accuracy ?? null);
          setLastUpdated(new Date());
          setMapLoading(false);
          setMapError(null);
          resolve(coords);
        },
        (err) => {
          console.log('❌ getCurrentLocation error:', err);
          // Try fallback with less strict options
          if (err.code === 3) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserCoords(coords);
                setAccuracy(pos.coords.accuracy ?? null);
                setLastUpdated(new Date());
                setMapLoading(false);
                setMapError(null);
                resolve(coords);
              },
              (fallbackErr) => {
                const errorMessage = 'Location timeout. Please try again or check your GPS signal.';
                setMapError(errorMessage);
                setMapLoading(false);
                reject(new Error(errorMessage));
              },
              { 
                enableHighAccuracy: false, 
                maximumAge: 300000, // 5 minutes
                timeout: 60000 // 1 minute timeout
              }
            );
          } else {
            const errorMessage = err.message || 'Unable to get location';
            setMapError(errorMessage);
            setMapLoading(false);
            reject(new Error(errorMessage));
          }
        },
        { 
          enableHighAccuracy: false, // Start with network location for speed
          maximumAge: 60000, // 1 minute max age
          timeout: 30000 // 30 second timeout
        }
      );
    });
  };

  const setUserCoordsExternal = (coords: LocationCoords | null) => {
    setUserCoords(coords);
  };

  useEffect(() => {
    let mounted = true;
    const maybeAutoWatch = async () => {
      if (!autoWatch) return;

      const state = await checkPermissionState();

      // Only auto-start the watch when permission is already granted. This avoids
      // silently calling geolocation APIs on iOS web where the prompt may not appear
      // without a user gesture.
      if (state === 'granted') {
        if (mounted) startLocationWatch();
      } else if (state === 'denied') {
        if (mounted) setMapError('Location permission denied. Enable it in your browser settings.');
      } else {
        // 'prompt' or unsupported: do not auto-request to avoid suppressed prompts on iOS.
        if (mounted) setMapError('Tap the location button to enable location access');
      }
    };

    maybeAutoWatch();

    return () => {
      clearLocation();
    };
  }, [autoWatch]);

  const contextValue: LocationContextType = {
    userCoords,
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    watching,
    refreshLocation,
    getCurrentLocation,
    clearLocation,
    setUserCoords: setUserCoordsExternal,
  startWatching: requestPermissionAndWatch,
  stopWatching: clearLocation,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

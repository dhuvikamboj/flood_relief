import { useContext } from 'react';
import { LocationContext } from '../contexts/LocationContext';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface UseLocationReturn {
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

export interface UseLocationOptions {
  autoWatch?: boolean;
}

// Hook that uses the location context
export const useLocation = (): UseLocationReturn => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

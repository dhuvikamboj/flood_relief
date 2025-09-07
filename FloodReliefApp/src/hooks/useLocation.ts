import { useContext } from 'react';
import { LocationContext, LocationContextType } from '../contexts/LocationContext';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface UseLocationReturn extends LocationContextType {}

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

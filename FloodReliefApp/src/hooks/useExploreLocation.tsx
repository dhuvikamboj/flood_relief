import React, { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { LocationCoords } from './useLocation';
import { useLocation } from './useLocation';

export interface ExploreLocationState {
  exploreCoords: LocationCoords | null;
  isExploring: boolean;
  setExploreLocation: (coords: LocationCoords) => void;
  clearExploreLocation: () => void;
  getActiveCoords: (userCoords: LocationCoords | null) => LocationCoords | null;
}

// Create context for explore location state
const ExploreLocationContext = createContext<ExploreLocationState | undefined>(undefined);

export interface ExploreLocationProviderProps {
  children: ReactNode;
}

// Provider component to share explore location state globally
export const ExploreLocationProvider: React.FC<ExploreLocationProviderProps> = ({ children }) => {
  const [exploreCoords, setExploreCoords] = useState<LocationCoords | null>(null);
  const { stopWatching, startWatching, watching } = useLocation();

  const setExploreLocation = useCallback((coords: LocationCoords) => {
    console.log('🗺️ Setting explore location:', coords);
    console.log('📍 Stopping GPS watching to prevent interference during exploration');
    
    // Stop GPS watching when starting exploration
    if (watching) {
      stopWatching();
    }
    
    setExploreCoords(coords);
  }, [stopWatching, watching]);

  const clearExploreLocation = useCallback(() => {
    console.log('🏠 Clearing explore location, returning to user location');
    console.log('📍 Restarting GPS watching');
    
    setExploreCoords(null);
    
    // Restart GPS watching when ending exploration
    setTimeout(() => {
      startWatching();
    }, 100); // Small delay to ensure state is updated
  }, [startWatching]);

  const getActiveCoords = useCallback((userCoords: LocationCoords | null): LocationCoords | null => {
    // Return explore coords if exploring, otherwise return user coords
    return exploreCoords || userCoords;
  }, [exploreCoords]);

  const value: ExploreLocationState = {
    exploreCoords,
    isExploring: !!exploreCoords,
    setExploreLocation,
    clearExploreLocation,
    getActiveCoords
  };

  return (
    <ExploreLocationContext.Provider value={value}>
      {children}
    </ExploreLocationContext.Provider>
  );
};

/**
 * Hook to manage exploration of different locations on the map.
 * When exploring, this location overrides user's GPS location for data fetching.
 * Also stops GPS watching to prevent interference during exploration.
 */
export const useExploreLocation = (): ExploreLocationState => {
  const context = useContext(ExploreLocationContext);
  if (context === undefined) {
    throw new Error('useExploreLocation must be used within an ExploreLocationProvider');
  }
  return context;
};

export default useExploreLocation;

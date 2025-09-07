import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MapInstance, 
  MapCoordinates, 
  MapMarker, 
  MapEventHandlers,
  MapProviderResult 
} from '../providers/map/mapTypes';
import { createMap, createMapConfiguration } from '../providers/map';
import { useLocation } from './useLocation';
import { 
  DEFAULT_MAP_LAYERS, 
  getMapLayerPreference, 
  saveMapLayerPreference, 
  MAP_PRESETS,
  MapPresetKey,
  generateUserLocationIconDataUrl,
  generateExploreLocationIconDataUrl
} from '../config/mapConfig';

export interface UseMapOptions {
  preset?: MapPresetKey;
  initialZoom?: number;
  autoCenter?: boolean;
  interactive?: boolean;
  preferredProvider?: string;
  eventHandlers?: Partial<MapEventHandlers>;
  exploreCoords?: { lat: number; lng: number } | null;
}

export interface UseMapResult {
  mapRef: React.RefObject<HTMLDivElement | null>;
  mapInstance: MapInstance | null;
  isReady: boolean;
  error: string | null;
  currentLayer: string;
  setCurrentLayer: (layer: string) => void;
  addMarker: (marker: MapMarker) => string;
  removeMarker: (markerId: string) => void;
  updateMarker: (markerId: string, coordinates: MapCoordinates) => void;
  clearMarkers: () => void;
  clearDataMarkers: () => void;
  setView: (center: MapCoordinates, zoom?: number) => void;
  getCenter: () => MapCoordinates | null;
  getZoom: () => number | null;
  refresh: () => void;
}

export function useMap(
  isVisible: boolean = true, 
  options: UseMapOptions = {}
): UseMapResult {
  const { preset = 'display', initialZoom, autoCenter = false, interactive = true, preferredProvider, eventHandlers: customEventHandlers, exploreCoords } = options;
  
  const { userCoords, stopWatching, lastUpdated, setUserCoords } = useLocation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const providerRef = useRef<MapProviderResult | null>(null);
  const initializationAttempts = useRef<number>(0);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(!document.hidden);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLayer, setCurrentLayerState] = useState<string>(() => getMapLayerPreference());

  // Track page visibility for navigation detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (visible && isVisible && mapInstanceRef.current) {
        // Page became visible - refresh map
        setTimeout(() => {
          try {
            mapInstanceRef.current?.invalidateSize();
            const center = mapInstanceRef.current?.getCenter();
            const zoom = mapInstanceRef.current?.getZoom();
            if (center && zoom) {
              mapInstanceRef.current?.setView(center, zoom);
            }
          } catch (refreshError) {
            console.warn('Error refreshing map after navigation:', refreshError);
          }
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible]);

  // Initialize map when container is ready and visible
  useEffect(() => {
    if (!isVisible || !isPageVisible || !mapRef.current || !userCoords) {
      return;
    }

    // Check if container has proper dimensions
    const container = mapRef.current;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Container not ready, retry after delay
      const timer = setTimeout(() => {
        if (mapRef.current && isVisible) {
          const newRect = mapRef.current.getBoundingClientRect();
          if (newRect.width > 0 && newRect.height > 0) {
            // Force re-initialization by incrementing attempts
            initializationAttempts.current++;
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }

    // Don't re-initialize if map already exists and is properly attached
    if (mapInstanceRef.current && mapInstanceRef.current.getContainer().parentNode) {
      return;
    }

    initializeMap();
  }, [isVisible, isPageVisible, userCoords, initializationAttempts.current]);

  const initializeMap = async () => {
    if (!mapRef.current || !userCoords) return;

    try {
      setError(null);
      setIsReady(false);

      // Clean up existing map if necessary
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (cleanupError) {
          console.warn('Error cleaning up existing map:', cleanupError);
        }
        mapInstanceRef.current = null;
        providerRef.current = null;
      }

      // Create event handlers
      const eventHandlers: MapEventHandlers = {};
      
      if (interactive) {
        eventHandlers.onMapClick = (coords: MapCoordinates) => {
          if (autoCenter) {
            stopWatching();
            setUserCoords(coords);
          }
        };

        eventHandlers.onMapDragStart = () => {
          if (autoCenter) {
            stopWatching();
          }
        };

        eventHandlers.onMapZoomStart = () => {
          if (autoCenter) {
            stopWatching();
          }
        };
      }

      // Merge with custom event handlers from options
      if (customEventHandlers) {
        Object.assign(eventHandlers, customEventHandlers);
      }

      // Get preset configuration
      const presetConfig = MAP_PRESETS[preset];
      const zoom = initialZoom || presetConfig.initialZoom;

      // Create map configuration
      const mapConfig = createMapConfiguration(
        mapRef.current,
        userCoords,
        zoom,
        eventHandlers,
        {
          minZoom: presetConfig.minZoom,
          maxZoom: presetConfig.maxZoom,
          attributionControl: presetConfig.attributionControl,
          zoomControl: presetConfig.zoomControl
        }
      );

      // Create map instance
      const result = await createMap(mapConfig, preferredProvider);
      
      mapInstanceRef.current = result.instance;
      providerRef.current = result;
      
      // Set active layer
      result.instance.setActiveLayer(currentLayer);
      
      setIsReady(true);
      
    } catch (initError) {
      console.error('Failed to initialize map:', initError);
      setError(initError instanceof Error ? initError.message : 'Failed to initialize map');
      setIsReady(false);
    }
  };

  // Handle layer changes
  const setCurrentLayer = useCallback((layer: string) => {
    if (layer in DEFAULT_MAP_LAYERS) {
      setCurrentLayerState(layer);
      saveMapLayerPreference(layer);
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.setActiveLayer(layer);
        } catch (layerError) {
          console.warn('Error changing map layer:', layerError);
        }
      }
    }
  }, []);

  // Map manipulation functions
  const addMarker = useCallback((marker: MapMarker): string => {
    if (!mapInstanceRef.current) {
      throw new Error('Map is not ready');
    }
    return mapInstanceRef.current.addMarker(marker);
  }, []);

  const removeMarker = useCallback((markerId: string): void => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.removeMarker(markerId);
    }
  }, []);

  const updateMarker = useCallback((markerId: string, coordinates: MapCoordinates): void => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.updateMarker(markerId, coordinates);
    }
  }, []);

  const clearMarkers = useCallback((): void => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.clearMarkers();
    }
  }, []);

  const clearDataMarkers = useCallback((): void => {
    if (!mapInstanceRef.current) return;
    
    console.log('🧹 Clearing data markers, preserving user location...');
    
    // Get all current markers and remove only non-user-location markers
    // Note: This is a workaround since we don't have direct access to marker IDs
    // We'll need to track markers differently
    mapInstanceRef.current.clearMarkers();
    
    // Re-add user location marker if coordinates are available
    if (userCoords && isReady) {
      console.log('🔄 Re-adding user location marker after clearing data markers');
      
      const userLocationMarker: MapMarker = {
        id: 'user-location',
        coordinates: userCoords,
        popupContent: `<div style="text-align: center;">
          <strong>Your Location</strong><br/>
          <small>${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}</small><br/>
          <small>Updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Unknown'}</small><br/>
          <a href="https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}" target="_blank" rel="noopener noreferrer" style="color: #3880ff; text-decoration: none;">View on Google Maps</a>
        </div>`,
        options: {
          icon: {
            url: generateUserLocationIconDataUrl(),
            size: [24, 24],
            anchor: [12, 12],
            popupAnchor: [0, -12]
          }
        }
      };

      try {
        addMarker(userLocationMarker);
        console.log('✅ User location marker re-added successfully');
      } catch (error) {
        console.warn('❌ Failed to re-add user location marker:', error);
      }
    }
  }, [userCoords, isReady, lastUpdated, addMarker]);

  const setView = useCallback((center: MapCoordinates, zoom?: number): void => {
    if (mapInstanceRef.current) {
      const currentZoom = zoom || mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setView(center, currentZoom);
    }
  }, []);

  const getCenter = useCallback((): MapCoordinates | null => {
    return mapInstanceRef.current?.getCenter() || null;
  }, []);

  const getZoom = useCallback((): number | null => {
    return mapInstanceRef.current?.getZoom() || null;
  }, []);

  const refresh = useCallback((): void => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.invalidateSize();
        const center = mapInstanceRef.current.getCenter();
        const zoom = mapInstanceRef.current.getZoom();
        mapInstanceRef.current.setView(center, zoom);
      } catch (refreshError) {
        console.warn('Error refreshing map:', refreshError);
      }
    }
  }, []);

  // Add user location marker when map is ready and user coordinates are available
  useEffect(() => {
    console.log('🎯 User location marker effect triggered:', { 
      isReady, 
      hasMapInstance: !!mapInstanceRef.current, 
      userCoords,
      lastUpdated: lastUpdated?.toISOString()
    });
    
    if (!isReady || !mapInstanceRef.current || !userCoords) {
      console.log('🚫 Skipping user location marker update - conditions not met');
      return;
    }

    const userLocationMarker: MapMarker = {
      id: 'user-location',
      coordinates: userCoords,
      popupContent: `<div style="text-align: center;">
        <strong>Your Location</strong><br/>
        <small>${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}</small><br/>
        <small>Updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Unknown'}</small><br/>
        <a href="https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}" target="_blank" rel="noopener noreferrer" style="color: #3880ff; text-decoration: none;">View on Google Maps</a>
      </div>`,
      options: {
        icon: {
          url: generateUserLocationIconDataUrl(),
          size: [24, 24],
          anchor: [12, 12],
          popupAnchor: [0, -12]
        }
      }
    };

    try {
      // Remove existing user location marker first
      console.log('🗑️ Removing existing user location marker');
      removeMarker('user-location');
      // Add new user location marker
      console.log('📍 Adding new user location marker at:', userCoords);
      addMarker(userLocationMarker);
      console.log('✅ User location marker updated successfully');
    } catch (error) {
      console.warn('❌ Failed to add user location marker:', error);
    }

  }, [isReady, userCoords, lastUpdated, addMarker, removeMarker]);

  // Handle exploration marker updates
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) return;

    if (exploreCoords) {
      console.log('🔍 Adding exploration marker at:', exploreCoords);
      
      const exploreMarker: MapMarker = {
        id: 'explore-location',
        coordinates: exploreCoords,
        popupContent: `
          <div style="text-align: center;">
            <strong>Exploring Location</strong><br/>
            <small>${exploreCoords.lat.toFixed(6)}, ${exploreCoords.lng.toFixed(6)}</small><br/>
            <small style="color: #666;">Click location button to return to your GPS position</small>
          </div>
        `,
        options: {
          icon: {
            url: generateExploreLocationIconDataUrl(),
            size: [25, 25],
            anchor: [12.5, 12.5],
            popupAnchor: [0, -12.5]
          }
        }
      };

      try {
        // Remove existing exploration marker first
        removeMarker('explore-location');
        // Add new exploration marker
        addMarker(exploreMarker);
        console.log('✅ Exploration marker added successfully');
        
        // Center map on exploration location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(exploreCoords, 14);
        }
      } catch (error) {
        console.warn('❌ Failed to add exploration marker:', error);
      }
    } else {
      // Remove exploration marker when not exploring
      console.log('🗑️ Removing exploration marker');
      removeMarker('explore-location');
    }

  }, [isReady, exploreCoords, addMarker, removeMarker]);

  // Handle visibility changes - invalidate map size when becoming visible
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
          const center = mapInstanceRef.current?.getCenter();
          const zoom = mapInstanceRef.current?.getZoom();
          if (center && zoom) {
            mapInstanceRef.current?.setView(center, zoom);
          }
        } catch (refreshError) {
          console.warn('Error invalidating map size:', refreshError);
        }
      }, 150);
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (cleanupError) {
          console.warn('Error during map cleanup:', cleanupError);
        }
        mapInstanceRef.current = null;
      }
      if (providerRef.current) {
        try {
          providerRef.current.provider.cleanup();
        } catch (cleanupError) {
          console.warn('Error during provider cleanup:', cleanupError);
        }
        providerRef.current = null;
      }
    };
  }, []);

  return {
    mapRef,
    mapInstance: mapInstanceRef.current,
    isReady,
    error,
    currentLayer,
    setCurrentLayer,
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,
    clearDataMarkers,
    setView,
    getCenter,
    getZoom,
    refresh
  };
}

export default useMap;

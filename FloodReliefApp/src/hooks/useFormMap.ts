import { useEffect, useState } from 'react';
import { useMap, UseMapOptions } from './useMap';
import { MapMarker, MapCoordinates } from '../providers/map/mapTypes';
import { useLocation } from './useLocation';

export interface UseFormMapOptions extends Omit<UseMapOptions, 'autoCenter' | 'interactive'> {
  onLocationChange?: (coords: MapCoordinates) => void;
  markerDraggable?: boolean;
  initialMarkerCoords?: MapCoordinates;
}

export function useFormMap(
  isVisible: boolean = true,
  options: UseFormMapOptions = {}
) {
  const { 
    onLocationChange, 
    markerDraggable = true, 
    initialMarkerCoords,
    ...mapOptions 
  } = options;
  
  const { userCoords, setUserCoords, stopWatching } = useLocation();
  const [markerPosition, setMarkerPosition] = useState<MapCoordinates | null>(
    initialMarkerCoords || userCoords
  );
  const [markerId, setMarkerId] = useState<string | null>(null);
  
  const {
    mapRef,
    mapInstance,
    isReady,
    error,
    currentLayer,
    setCurrentLayer,
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,
    setView,
    getCenter,
    getZoom,
    refresh
  } = useMap(isVisible, {
    preset: 'form',
    autoCenter: false, // We'll handle this manually
    interactive: true,
    ...mapOptions,
    // Add map event handlers through the abstraction
    eventHandlers: {
      onMapClick: (coords: MapCoordinates) => {
        console.log('🗺️ Form map clicked at:', coords);
        stopWatching(); // Stop GPS tracking when user manually sets location
        setMarkerPosition(coords);
        setUserCoords(coords);
        onLocationChange?.(coords);
      },
      onMapDragStart: () => {
        stopWatching(); // Stop GPS tracking when user starts dragging
      }
    }
  });

  // Update marker position when user coordinates change
  useEffect(() => {
    if (userCoords && !markerPosition) {
      setMarkerPosition(userCoords);
    }
  }, [userCoords, markerPosition]);

  // Create or update marker when position changes
  useEffect(() => {
    if (!isReady || !mapInstance || !markerPosition) return;

    if (markerId) {
      // Update existing marker
      try {
        updateMarker(markerId, markerPosition);
        console.log('📍 Updated form marker position:', markerPosition);
      } catch (error) {
        console.warn('Failed to update marker position:', error);
      }
    } else {
      // Create new marker
      const marker: MapMarker = {
        id: 'form-marker',
        coordinates: markerPosition,
        options: {
          draggable: markerDraggable,
          icon: {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            size: [25, 41],
            anchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41]
          }
        }
      };

      try {
        const id = addMarker(marker);
        setMarkerId(id);
        console.log('📍 Added new form marker:', markerPosition);
      } catch (error) {
        console.warn('Failed to add form marker:', error);
      }
    }

    // Center map on marker
    setView(markerPosition, getZoom() || 16);

  }, [isReady, mapInstance, markerPosition, markerId, markerDraggable, addMarker, updateMarker, setView, getZoom]);

  // Update marker position programmatically
  const updateMarkerPosition = (coords: MapCoordinates) => {
    setMarkerPosition(coords);
    setUserCoords(coords);
    onLocationChange?.(coords);
  };

  // Center map on current marker
  const centerOnMarker = () => {
    if (markerPosition) {
      setView(markerPosition, getZoom() || 16);
    }
  };

  return {
    mapRef,
    mapInstance,
    isReady,
    error,
    currentLayer,
    setCurrentLayer,
    markerPosition,
    updateMarkerPosition,
    centerOnMarker,
    setView,
    getCenter,
    getZoom,
    refresh
  };
}

export default useFormMap;

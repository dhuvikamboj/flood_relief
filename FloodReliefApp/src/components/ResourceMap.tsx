import React, { useEffect, useRef } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonLabel,
  IonText,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/react';
import { locate, pin } from 'ionicons/icons';
import { useLocation } from '../hooks/useLocation';
import { useResourceMap } from '../hooks/useResourceMap.new';
import { useExploreLocation } from '../hooks/useExploreLocation';
import { ReliefResource } from '../types/resource';

interface ResourceMapProps {
  resources: ReliefResource[];
  isVisible?: boolean;
  onExploreLocationChange?: (coords: { lat: number; lng: number } | null) => void;
}

const ResourceMap: React.FC<ResourceMapProps> = ({ 
  resources, 
  isVisible = true,
  onExploreLocationChange 
}) => {
  const {
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    userCoords,
    getCurrentLocation,
    startWatching,
  } = useLocation();

  const { exploreCoords, setExploreLocation, clearExploreLocation } = useExploreLocation();

  // Track if we should pan to user location after getting GPS coordinates
  const shouldPanToUserRef = useRef(false);

  // Custom event handlers for exploration
  const customEventHandlers = {
    onMapClick: (coords: { lat: number; lng: number }) => {
      console.log('ResourceMap: Map clicked at', coords.lat, coords.lng);
      setExploreLocation(coords);
      // Notify parent component of explore location change
      if (onExploreLocationChange) {
        onExploreLocationChange(coords);
      }
    }
  };

  const { mapRef, currentLayer, setCurrentLayer, setView } = useResourceMap(
    resources, 
    isVisible, 
    {
      eventHandlers: customEventHandlers,
      exploreCoords
    }
  );

  const handleLocationButtonClick = async () => {
    console.log('🎯 Location button clicked');
    try {
      // Clear exploration location first
      clearExploreLocation();
      if (onExploreLocationChange) {
        onExploreLocationChange(null);
      }
      
      // Set flag to pan to user location once coordinates are available
      shouldPanToUserRef.current = true;
      
      // Then get current location
      await startWatching();
      console.log('✅ startWatching completed');
    } catch (error) {
      console.log('❌ startWatching error:', error);
    }
  };

  // Pan to user location when coordinates become available after location button click
  useEffect(() => {
    if (shouldPanToUserRef.current && userCoords && setView) {
      console.log('🗺️ Panning map to current location:', userCoords);
      setView(userCoords, 14); // Zoom level 14 for good detail
      shouldPanToUserRef.current = false; // Reset flag
    }
  }, [userCoords, setView]);

  return (
    <>
      <div className="map-container">
        <div className="map-meta">
          <div>
            {accuracy !== null && <small>Accuracy: {Math.round(accuracy)} m</small>}
            {lastUpdated && <small>Updated: {lastUpdated.toLocaleTimeString()}</small>}
        </div>
        <div>
          <select
            value={currentLayer}
            onChange={(e) => setCurrentLayer(e.target.value)}
            className="layer-select"
            title="Choose map layer"
          >
            <option value="satellite">🛰️ Satellite</option>
            <option value="streets">🗺️ Streets</option>
            <option value="terrain">🏔️ Terrain</option>
            <option value="topo">🗻 Topographic</option>
          </select>
        </div>
      </div>

      {mapError ? (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Map unavailable</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{mapError}</p>
          </IonCardContent>
        </IonCard>
      ) : mapLoading && !userCoords ? (
        <IonCard>
          <IonCardContent>
            <p>Locating you...</p>
          </IonCardContent>
        </IonCard>
      ) : userCoords ? (
        <div
          ref={mapRef}
          className="map-embed"
        />
      ) : (
        <IonCard>
          <IonCardContent>
            <div className="map-permission-cta">
              <p>Map will appear here when location permission is granted.</p>
              <IonButton onClick={async () => { try { await startWatching(); } catch {} }}>
                Enable location
              </IonButton>
              <small>Tap to allow location in your browser; on iOS use Settings → Safari → Location if previously denied.</small>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Floating Location Button */}
     <IonFab slot="fixed" vertical="bottom" horizontal="start" className="location-fab">
        <IonFabButton 
          className="location-fab-button"
          onClick={handleLocationButtonClick}
        >
          <IonIcon icon={locate} />
        </IonFabButton>
      </IonFab>
    </div>
     
    </>
  );
};

export default ResourceMap;

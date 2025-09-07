import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonText,
  IonIcon,
  IonChip,
  IonLabel
} from '@ionic/react';
import { map, layers, refresh } from 'ionicons/icons';
import { useMap } from '../hooks/useMap';
import { useLocation } from '../hooks/useLocation';
import { DEFAULT_MAP_LAYERS } from '../config/mapConfig';
import './MapDemo.css';

interface MapDemoProps {
  title: string;
  isVisible?: boolean;
}

/**
 * Demo component showing the new map provider abstraction
 * This component can be used to test different map providers
 */
const MapDemo: React.FC<MapDemoProps> = ({ title, isVisible = true }) => {
  const { userCoords } = useLocation();
  
  const {
    mapRef,
    isReady,
    error,
    currentLayer,
    setCurrentLayer,
    refresh: refreshMap
  } = useMap(isVisible, {
    preset: 'display',
    preferredProvider: 'leaflet' // Can be changed to test different providers
  });

  const handleLayerChange = (layerKey: string) => {
    setCurrentLayer(layerKey);
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{title}</IonCardTitle>
        <div className="map-demo-header">
          <IonIcon icon={map} color="primary" />
          <IonText color="medium">
            <small>Provider: Leaflet • Status: {isReady ? 'Ready' : 'Loading'}</small>
          </IonText>
        </div>
      </IonCardHeader>
      
      <IonCardContent>
        {/* Layer Selection */}
        <div className="map-demo-layer-selection">
          {Object.keys(DEFAULT_MAP_LAYERS).map(layerKey => (
            <IonChip
              key={layerKey}
              color={currentLayer === layerKey ? 'primary' : 'medium'}
              onClick={() => handleLayerChange(layerKey)}
              className="map-demo-layer-chip"
            >
              <IonIcon icon={layers} />
              <IonLabel>{layerKey}</IonLabel>
            </IonChip>
          ))}
        </div>

        {/* Map Container */}
        {error ? (
          <IonCard color="danger">
            <IonCardContent>
              <IonText color="danger">
                <p><strong>Map Error:</strong> {error}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : !userCoords ? (
          <IonCard>
            <IonCardContent>
              <IonText color="medium">
                <p>Waiting for location permissions...</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          <div
            ref={mapRef}
            className="map-demo-container"
          />
        )}

        {/* Controls */}
        <div className="map-demo-controls">
          <IonButton
            size="small"
            fill="outline"
            onClick={refreshMap}
            disabled={!isReady}
          >
            <IonIcon icon={refresh} slot="start" />
            Refresh
          </IonButton>
          
          <IonText color="medium" className="map-demo-controls-location">
            <small>
              {userCoords ? 
                `📍 ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : 
                'No location'
              }
            </small>
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default MapDemo;

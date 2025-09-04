import React from 'react';
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
import { locate } from 'ionicons/icons';
import { useLocation } from '../hooks/useLocation';
import { useResourceMap } from '../hooks/useResourceMap';
import { ReliefResource } from '../types/resource';

interface ResourceMapProps {
  resources: ReliefResource[];
}

const ResourceMap: React.FC<ResourceMapProps> = ({ resources }) => {
  const {
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    userCoords,
    getCurrentLocation,
    startWatching,
  } = useLocation();

  const { mapRef, currentLayer, setCurrentLayer } = useResourceMap(resources);

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
            <p>Map will appear here when location permission is granted.</p>
          </IonCardContent>
        </IonCard>
      )}

      {/* Floating Location Button */}
     <IonFab slot="fixed" vertical="bottom" horizontal="start" className="location-fab">
        <IonFabButton 
          className="location-fab-button"
          onClick={async () => { try { await startWatching(); } catch {} }}
        >
          <IonIcon icon={locate} />
        </IonFabButton>
      </IonFab>
    </div>
     
    </>
  );
};

export default ResourceMap;

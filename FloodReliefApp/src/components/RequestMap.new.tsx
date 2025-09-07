import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
} from '@ionic/react';
import { locate } from 'ionicons/icons';
import { ReliefRequest } from './RequestCard';
import { useLocation } from '../hooks/useLocation';
import { useRequestMap } from '../hooks/useRequestMap.new';
import { useTranslation } from 'react-i18next';

interface RequestMapProps {
  requests: ReliefRequest[];
  isVisible?: boolean;
}

const RequestMap: React.FC<RequestMapProps> = ({ requests, isVisible = true }) => {
  const { t } = useTranslation();
  const {
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    userCoords,
    getCurrentLocation,
    startWatching,
  } = useLocation();

  const { mapRef, currentLayer, setCurrentLayer } = useRequestMap(requests, isVisible);

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
            onClick={async () => { try { await startWatching(); } catch {} }}
          >
            <IonIcon icon={locate} />
          </IonFabButton>
        </IonFab>
      </div>
    </>
  );
};

export default RequestMap;

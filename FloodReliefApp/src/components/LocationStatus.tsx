import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonText } from '@ionic/react';
import { useLocation } from '../hooks/useLocation';
import './LocationStatus.css';

interface LocationStatusProps {
  showControls?: boolean;
}

const LocationStatus: React.FC<LocationStatusProps> = ({ showControls = true }) => {
  const {
    userCoords,
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    watching,
    refreshLocation,
    getCurrentLocation,
    clearLocation
  } = useLocation();

  const handleGetCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      console.log('Current location:', coords);
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Location Status</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {mapLoading && (
          <IonText color="primary">
            <p>Getting location...</p>
          </IonText>
        )}

        {mapError && (
          <IonText color="danger">
            <p>Error: {mapError}</p>
          </IonText>
        )}

        {userCoords && (
          <div>
            <IonText color="success">
              <p>📍 Location: {userCoords.lat.toFixed(6)}, {userCoords.lng.toFixed(6)}</p>
            </IonText>
            {accuracy && (
              <IonText color="medium">
                <p>🎯 Accuracy: {Math.round(accuracy)} meters</p>
              </IonText>
            )}
            {lastUpdated && (
              <IonText color="medium">
                <p>🕒 Last updated: {lastUpdated.toLocaleTimeString()}</p>
              </IonText>
            )}
            <IonText color={watching ? 'success' : 'warning'}>
              <p>👁️ Watching: {watching ? 'Active' : 'Inactive'}</p>
            </IonText>
          </div>
        )}

        {!userCoords && !mapLoading && !mapError && (
          <IonText color="medium">
            <p>No location data available</p>
          </IonText>
        )}

        {showControls && (
          <div className="location-controls">
            <IonButton
              onClick={refreshLocation}
              disabled={mapLoading}
              className="location-button"
            >
              Refresh Location
            </IonButton>
            <IonButton
              onClick={handleGetCurrentLocation}
              disabled={mapLoading}
              className="location-button"
            >
              Get Current Location
            </IonButton>
            <IonButton
              onClick={clearLocation}
              disabled={!watching}
              color="danger"
              className="location-button"
            >
              Stop Watching
            </IonButton>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default LocationStatus;

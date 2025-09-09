import React, { useEffect, useState } from 'react';
import { 
  IonAlert, 
  IonButton, 
  IonIcon, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle 
} from '@ionic/react';
import { locationOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useLocationPermissions } from '../hooks/useLocationPermissions';
import './LocationPermissionGuard.css';

interface LocationPermissionGuardProps {
  children: React.ReactNode;
}

export const LocationPermissionGuard: React.FC<LocationPermissionGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { permissionState, requestPermission } = useLocationPermissions();
  const [showPermissionCard, setShowPermissionCard] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  // Show permission request after app loads if permission hasn't been determined
  useEffect(() => {
    const timer = setTimeout(() => {
      if (permissionState.status === 'prompt' && !permissionState.hasRequestedOnLaunch) {
        setShowPermissionCard(true);
      }
    }, 1500); // Small delay to let the app load

    return () => clearTimeout(timer);
  }, [permissionState.status, permissionState.hasRequestedOnLaunch]);

  const handleRequestPermission = async () => {
    setShowPermissionCard(false);
    const granted = await requestPermission();
    
    if (!granted) {
      // Show additional guidance if permission was denied
      setShowPermissionAlert(true);
    }
  };

  const handleSkipPermission = () => {
    setShowPermissionCard(false);
  };

  return (
    <>
      {children}
      
      {/* Permission Request Card */}
      {showPermissionCard && (
        <div className="location-permission-overlay">
          <IonCard className="location-permission-card">
            <IonCardHeader>
              <div className="location-permission-header">
                <IonIcon 
                  icon={locationOutline} 
                  className="location-permission-icon"
                />
                <IonCardTitle>
                  {t('locationPermission.title', 'Enable Location Access')}
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <p>
                {t('locationPermission.description', 
                  'This app uses location services to help you find nearby relief resources and accurately report your location during emergencies.'
                )}
              </p>
              <p className="location-permission-privacy">
                {t('locationPermission.privacy', 
                  'Your location data is only used within the app and is not shared with third parties.'
                )}
              </p>
              
              <div className="location-permission-buttons">
                <IonButton 
                  expand="block" 
                  onClick={handleRequestPermission}
                  disabled={permissionState.isLoading}
                >
                  <IonIcon icon={checkmarkCircle} slot="start" />
                  {t('locationPermission.allow', 'Allow Location')}
                </IonButton>
                
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={handleSkipPermission}
                >
                  {t('locationPermission.skip', 'Skip')}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      {/* Permission Denied Alert */}
      <IonAlert
        isOpen={showPermissionAlert}
        onDidDismiss={() => setShowPermissionAlert(false)}
        header={t('locationPermission.deniedTitle', 'Location Permission')}
        message={t('locationPermission.deniedMessage', 
          'Location access was not granted. You can still use the app, but some features may be limited. You can enable location access later in your device settings.'
        )}
        buttons={[
          {
            text: t('common.ok', 'OK'),
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default LocationPermissionGuard;

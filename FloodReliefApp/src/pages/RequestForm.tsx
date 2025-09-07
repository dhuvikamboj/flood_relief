import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getApiBaseUrl } from '../config/api';
// marker icons for Vite

import './RequestForm.css';
import axios from 'axios';
import { useLocation } from '../hooks/useLocation';
import { MAP_LAYERS, MapLayerKey, getMapLayerPreference, saveMapLayerPreference } from '../utils/mapLayers';
import ReactGA4 from 'react-ga4';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonToast,
  IonBackButton,
  IonButtons
  ,IonProgressBar,
  IonText
} from '@ionic/react';
import { useTranslation } from 'react-i18next';

interface Props {
  // optional: you can wire this to a store or API later
}

const RequestForm: React.FC<Props> = () => {
  const auth = useAuth();
  const { t } = useTranslation();

  // Use the location hook without auto-watching
  const {
    userCoords,
    mapError,
    mapLoading,
  getCurrentLocation,
  setUserCoords,
  stopWatching,
  startWatching
  } = useLocation();

  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [priority, setPriority] = useState('');
  const [requestType, setRequestType] = useState('');
  const [details, setDetails] = useState('');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const mapZoomRef = useRef<number | null>(16);
  const [currentLayer, setCurrentLayer] = useState<MapLayerKey>(() => {
    return getMapLayerPreference();
  });
  // Manual override now handled by stopping the geolocation watcher

  // Save layer preference to localStorage whenever it changes
  useEffect(() => {
    saveMapLayerPreference(currentLayer);
  }, [currentLayer]);

  // Auto-populate the location input when coordinates become available
  useEffect(() => {
    if (userCoords) {
      setLocation(`${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}`);
    }
  }, [userCoords]);
  useEffect(()=>{
    getCurrentLocation();
  },[])
  // initialize Leaflet map using imported library
  useEffect(() => {
    if (!mapRef.current) return;

    // Ensure default icon URLs are correct for bundlers
    try {
    //   L.Icon.Default.mergeOptions({
    //     iconRetinaUrl: '/images/marker-icon-2x.png',
    //     iconUrl: '/images/marker-icon.png',
    //     shadowUrl: '/images/marker-shadow.png',
    //   });
    } catch (err) {
      // ignore
    }

    // avoid recreating
    if (leafletMapRef.current) {
      if (userCoords) {
        try {
          const currentZoom = typeof leafletMapRef.current.getZoom === 'function'
            ? leafletMapRef.current.getZoom()
            : 16;
          leafletMapRef.current.setView([userCoords.lat, userCoords.lng], currentZoom);
        } catch (e) {
          try { leafletMapRef.current.setView([userCoords.lat, userCoords.lng]); } catch {}
        }
      }
      return;
    }

    const map = L.map(mapRef.current as HTMLElement).setView(userCoords ? [userCoords.lat, userCoords.lng] : [0,0], userCoords ?( mapZoomRef.current ? mapZoomRef.current : 16):17);
    // Add the current layer to the map
    MAP_LAYERS[currentLayer].addTo(map);
    leafletMapRef.current = map;

    if (userCoords) {
      const marker = L.marker([userCoords.lat, userCoords.lng], { draggable: true,  }).addTo(map);
      leafletMarkerRef.current = marker;
      // update on dragend
      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        const pos = { lat: latlng.lat, lng: latlng.lng };
        setUserCoords(pos);
        setLocation(`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
        stopWatching(); // Stop auto-updating location from GPS
      });


    }
    map.on('zoomlevelschange', () => {
      const zoom = map.getZoom();
      console.log(zoom);
      
      mapZoomRef.current = zoom;
    });
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      const pos = { lat, lng };
      setUserCoords(pos);
      setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      stopWatching(); // Stop auto-updating location from GPS
      // move or create marker
      if (leafletMarkerRef.current) {
        leafletMarkerRef.current.setLatLng([lat, lng]);
      } else {
        leafletMarkerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        leafletMarkerRef.current.on('dragend', () => {
          const latlng = (leafletMarkerRef.current as L.Marker).getLatLng();
          const p = { lat: latlng.lat, lng: latlng.lng };
          setUserCoords(p);
          setLocation(`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
          stopWatching(); // Stop auto-updating location from GPS
        });
      }
      // re-center but preserve zoom
      try {
        const z = typeof map.getZoom === 'function' ? map.getZoom() : undefined;
        if (typeof z === 'number') map.setView([lat, lng], z);
        else map.setView([lat, lng]);
      } catch (e) { try { map.setView([lat, lng]); } catch {} }
    });

    return () => {
      try { map.remove(); } catch {}
      leafletMapRef.current = null;
      leafletMarkerRef.current = null;
    };
  }, [userCoords]);

  // Handle layer changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Remove all existing tile layers
    Object.values(MAP_LAYERS).forEach(layer => {
      if (leafletMapRef.current?.hasLayer(layer)) {
        leafletMapRef.current.removeLayer(layer);
      }
    });

    // Add the new layer
    MAP_LAYERS[currentLayer].addTo(leafletMapRef.current);
  }, [currentLayer]);

  const handleSubmit = () => {
    if (!location || !priority || !details || !requestType) {
    setToastMessage(t('forms.fillAllFields'));
      setShowToast(true);
      return;
    }

    // Track form submission attempt
    ReactGA4.event('form_submit_attempt', {
      form_name: 'relief_request',
      request_type: requestType,
      priority: priority
    });

    // Build FormData and POST with progress
    const form = new FormData();
    form.append('location', location);
    if (address) form.append('address', address);
    if (contact) form.append('contact', contact);
    form.append('priority', String(priority));
    form.append('requestType', String(requestType));
    form.append('details', details);
    if (userCoords) {
      form.append('coords[lat]', String(userCoords.lat));
      form.append('coords[lng]', String(userCoords.lng));
    }
  photoFiles.forEach((f) => form.append('photos[]', f, f.name));
  // Append videos using 'videos' (Laravel accepts videos[] or videos) — keep videos[] for compatibility
  videoFiles.forEach((f) => form.append('videos[]', f, f.name));

    // Prefer Vite env var VITE_API_URL, fallback to centralized config
    const apiBase = getApiBaseUrl();
    const endpoint = `${apiBase.replace(/\/$/, '')}/api/requests`;

    setUploading(true);
    setUploadProgress(0);

    const headers: Record<string,string> = {
      'Accept': 'application/json',
    };
    if (auth && auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
    
    axios.post(endpoint, form, {
      headers,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(pct);
        }
      }
  }).then((res) => {
      setUploading(false);
      setUploadProgress(null);
      // Track successful submission
      ReactGA4.event('form_submit_success', {
        form_name: 'relief_request',
        request_type: requestType,
        priority: priority,
        photo_count: photoFiles.length,
        video_count: videoFiles.length
      });
  setToastMessage(t('requestForm.submitted'));
      setShowToast(true);
  setLocation('');
      setAddress('');
      setContact('');
      setPriority('');
      setRequestType('');
      setDetails('');
      setPhotoFiles([]);
      setVideoFiles([]);
  startWatching(); // Resume GPS watching for next request
      console.log('Request saved', res.data);
          setTimeout(() => {
       window.location.href = '/tabs/reports';
      }, 3000);
    }).catch((err) => {
      setUploading(false);
      setUploadProgress(null);
      // Track submission failure
      ReactGA4.event('form_submit_failure', {
        form_name: 'relief_request',
        request_type: requestType,
        priority: priority,
        error_type: err.response?.status?.toString() || 'unknown'
      });
      // Prefer structured validation errors from Laravel
      let msg = 'Upload failed';
      try {
        if (err?.response?.data) {
          const data = err.response.data;
          if (data.errors) {
            // flatten errors object
            const all: string[] = [];
            Object.keys(data.errors).forEach((k) => {
              const v = data.errors[k];
              if (Array.isArray(v)) all.push(...v);
              else if (typeof v === 'string') all.push(v);
            });
            msg = all.join('; ');
          } else if (data.message) {
            msg = data.message;
          }
        } else if (err.message) {
          msg = err.message;
        }
      } catch (e) {
        msg = err.message || 'Upload failed';
      }

      console.error('Upload error', err);
  setToastMessage(msg);
      setShowToast(true);
    });
  };

  const onPhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setPhotoFiles(files);
    // Track photo upload
    ReactGA4.event('file_upload', {
      file_type: 'photo',
      file_count: files.length
    });
  };

  const onVideosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setVideoFiles(Array.from(e.target.files));
  };

  const handleGetCurrentLocation = async () => {
    // Track location request
    ReactGA4.event('location_request', {
      method: 'gps'
    });

    try {
  setToastMessage(t('common.gettingLocation'));
      setShowToast(true);

  const coords = await getCurrentLocation();
  startWatching(); // Ensure watching resumes after manual stop

  // Track successful location
  ReactGA4.event('location_success', {
    method: 'gps'
  });

  setToastMessage(t('common.locationUpdated'));
      setShowToast(true);

      // Update map and marker if initialized
      try {
        if (leafletMapRef.current) {
          const z = typeof leafletMapRef.current.getZoom === 'function' ? leafletMapRef.current.getZoom() : undefined;
          if (typeof z === 'number') leafletMapRef.current.setView([coords.lat, coords.lng], z);
          else leafletMapRef.current.setView([coords.lat, coords.lng]);
        }
        if (leafletMarkerRef.current) {
          try { leafletMarkerRef.current.setLatLng([coords.lat, coords.lng]); } catch (e) {}
        } else if (leafletMapRef.current) {
          try {
            leafletMarkerRef.current = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(leafletMapRef.current);
            leafletMarkerRef.current.on('dragend', () => {
              const latlng = (leafletMarkerRef.current as L.Marker).getLatLng();
              const p = { lat: latlng.lat, lng: latlng.lng };
              setUserCoords(p);
              setLocation(`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
              stopWatching(); // Stop auto-updating location from GPS
            });
          } catch (e) {}
        }
      } catch (e) {
        // ignore map errors
      }
    } catch (error: any) {
      console.error('Location error:', error);
      // Track location failure
      ReactGA4.event('location_failure', {
        method: 'gps',
        error_type: error.message?.includes('permission') ? 'permission_denied' :
                   error.message?.includes('timeout') ? 'timeout' :
                   error.message?.includes('unavailable') ? 'unavailable' : 'unknown'
      });

      // Provide more helpful error messages
  let errorMessage = t('common.locationFailed');
      if (error.message?.includes('permission')) {
  errorMessage = t('common.locationPermissionDenied');
      } else if (error.message?.includes('timeout')) {
  errorMessage = t('common.locationTimeout');
      } else if (error.message?.includes('unavailable')) {
  errorMessage = t('common.locationUnavailable');
      } else if (error.message) {
        errorMessage = error.message;
      }

      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
                  <IonBackButton defaultHref="/tabs/reports" text={t('common.back')} />
            </IonButtons>
            <IonTitle>{t('requestForm.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
      <IonContent>
        <IonCard className="request-form">
          <IonCardHeader>
            <IonCardTitle>{t('requestForm.title')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>

            <div>
              <div className="map-container">
                <div className="map-controls">
                  <select
                    value={currentLayer}
                    onChange={(e) => setCurrentLayer(e.target.value as MapLayerKey)}
                    className="layer-select"
                    title="Choose map layer"
                  >
                    <option value="satellite">🛰️ Satellite</option>
                    <option value="streets">🗺️ Streets</option>
                    <option value="terrain">🏔️ Terrain</option>
                    <option value="topo">� Topographic</option>
                  </select>
                </div>
                <div ref={(el) => { if (el) mapRef.current = el; }} id="request-map" className="map-embed" />
              </div>
              <small>{t('requestForm.mapNote')}</small>
              <div className="map-refresh-note">
                <IonText color="medium">
                      <small>({t('requestForm.mapRefreshNote')})</small>
                </IonText>
              </div>
            </div>

            <IonItem>
              <IonLabel position="stacked">{t('forms.location')}</IonLabel>
              <div className="location-input-row">
                <IonInput value={location} readonly placeholder={t('forms.locationPlaceholder')} />
                <IonButton
                  size="small"
                  onClick={handleGetCurrentLocation}
                  disabled={mapLoading}
                >
                  {mapLoading ? t('common.gettingLocation') : t('common.getCurrentLocation')}
                </IonButton>
              </div>
              {mapError && (
                <div className="location-error">
                  {mapError}
                </div>
              )}
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">{t('forms.addressOptional')}</IonLabel>
              <IonInput value={address} onIonInput={(e) => setAddress(e.detail.value!)} placeholder={t('forms.addressPlaceholder')} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">{t('forms.contactInfo')}</IonLabel>
              <IonInput value={contact} onIonInput={(e) => setContact(e.detail.value!)} placeholder={t('forms.contactPlaceholder')} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">{t('forms.typeOfRelief')}</IonLabel>
              <IonSelect value={requestType} placeholder={t('common.select')} onIonChange={e => setRequestType(e.detail.value!)}>
                <IonSelectOption value="Food">{t('forms.types.food')}</IonSelectOption>
                <IonSelectOption value="Water">{t('forms.types.water')}</IonSelectOption>
                <IonSelectOption value="Shelter">{t('forms.types.shelter')}</IonSelectOption>
                <IonSelectOption value="Medical">{t('forms.types.medical')}</IonSelectOption>
                <IonSelectOption value="Animal">{t('forms.types.animal')}</IonSelectOption>
                <IonSelectOption value="Other">{t('forms.types.other')}</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">{t('forms.priority')}</IonLabel>
              <IonSelect value={priority} placeholder={t('common.select')} onIonChange={(e) => setPriority(e.detail.value)}>
                <IonSelectOption value="Low">{t('forms.priorities.low')}</IonSelectOption>
                <IonSelectOption value="Medium">{t('forms.priorities.medium')}</IonSelectOption>
                <IonSelectOption value="High">{t('forms.priorities.high')}</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">{t('forms.details')}</IonLabel>
              <IonTextarea value={details} onIonInput={(e) => setDetails(e.detail.value!)} rows={6} />
            </IonItem>

        <div className="media-uploads">
          <IonItem>
            <IonLabel>Photos (multiple)</IonLabel>
            <input aria-label="photos" title="photos" type="file" accept="image/*" multiple onChange={onPhotosSelected} />
          </IonItem>
          {photoFiles.length > 0 && (
            <div className="media-photos">
              {photoFiles.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt={f.name} />
              ))}
            </div>
          )}

          {/* Videos upload temporarily hidden */}
        </div>
            <IonButton expand="block" onClick={handleSubmit} className="submit-button" disabled={uploading}>{t('forms.submitRequest')}</IonButton>
            {uploading && typeof uploadProgress === 'number' && (
              <div className="upload-progress">
                <IonLabel>Uploading: {uploadProgress}%</IonLabel>
                <IonProgressBar value={uploadProgress / 100} />
              </div>
            )}
          </IonCardContent>
        </IonCard>


        <IonToast isOpen={showToast} message={toastMessage} duration={2000} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default RequestForm;

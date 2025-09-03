import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// marker icons for Vite

import './RequestForm.css';
import axios from 'axios';
import { useLocation } from '../hooks/useLocation';
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
  ,IonProgressBar
} from '@ionic/react';

interface Props {
  // optional: you can wire this to a store or API later
}

const ResourceForm: React.FC<Props> = () => {
  const auth = useAuth();

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
  const [contactPhone, setContactPhone] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [capacity, setCapacity] = useState<number | undefined>();
  const [availability, setAvailability] = useState('available');
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
  const [currentLayer, setCurrentLayer] = useState<string>(() => {
    const saved = localStorage.getItem('preferred_map_layer');
    return saved || 'satellite';
  });
  // Manual override is managed by stopping/starting the geolocation watcher

  // Save layer preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('preferred_map_layer', currentLayer);
  }, [currentLayer]);

  // Define map layers
  const mapLayers = {
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    terrain: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS'
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    })
  };

  // auto-populate the location input when coordinates become available
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
    mapLayers[currentLayer as keyof typeof mapLayers].addTo(map);
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
    Object.values(mapLayers).forEach(layer => {
      if (leafletMapRef.current?.hasLayer(layer)) {
        leafletMapRef.current.removeLayer(layer);
      }
    });

    // Add the new layer
    mapLayers[currentLayer as keyof typeof mapLayers].addTo(leafletMapRef.current);
  }, [currentLayer]);

  const handleSubmit = () => {
    if (!location || !resourceType || !details) {
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      return;
    }
    // Build FormData and POST with progress
    const form = new FormData();
    form.append('location', location);
    if (address) form.append('address', address);
    if (contact) form.append('contact', contact);
    if (contactPhone) form.append('contact_phone', contactPhone);
    form.append('resource_type', String(resourceType));
    if (capacity !== undefined) form.append('capacity', String(capacity));
    form.append('availability', availability);
    form.append('details', details);
    if (userCoords) {
      form.append('coords[lat]', String(userCoords.lat));
      form.append('coords[lng]', String(userCoords.lng));
    }
  photoFiles.forEach((f) => form.append('photos[]', f, f.name));
  // Append videos using 'videos' (Laravel accepts videos[] or videos) — keep videos[] for compatibility
  videoFiles.forEach((f) => form.append('videos[]', f, f.name));

    // Prefer Vite env var VITE_API_URL, fallback to localhost
    const apiBase = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
    const endpoint = `${apiBase.replace(/\/$/, '')}/api/resources`;

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
      setToastMessage('Relief resource added successfully');
      setShowToast(true);
      setLocation('');
      setAddress('');
      setContact('');
      setContactPhone('');
      setResourceType('');
      setCapacity(undefined);
      setAvailability('available');
      setDetails('');
      setPhotoFiles([]);
  setVideoFiles([]);
  startWatching(); // Resume GPS watching for next resource
      console.log('Resource saved', res.data);
          setTimeout(() => {
       window.location.href = '/tabs/resources';
      }, 3000);
    }).catch((err) => {
      setUploading(false);
      setUploadProgress(null);
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
    setPhotoFiles(Array.from(e.target.files));
  };

  const onVideosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setVideoFiles(Array.from(e.target.files));
  };

  const handleGetCurrentLocation = async () => {
    try {
      setToastMessage('Getting current location...');
      setShowToast(true);

  const coords = await getCurrentLocation();
  startWatching(); // Ensure watching resumes after manual stop

      setToastMessage('Location updated successfully!');
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

      // Provide more helpful error messages
      let errorMessage = 'Failed to get location.';
      if (error.message?.includes('permission')) {
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again or check your GPS signal.';
      } else if (error.message?.includes('unavailable')) {
        errorMessage = 'Geolocation is not available in this browser.';
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
              <IonBackButton defaultHref="/tabs/resources" text="Back" />
            </IonButtons>
            <IonTitle>Add Relief Resource</IonTitle>
          </IonToolbar>
        </IonHeader>
      <IonContent>
        <IonCard className="request-form">
          <IonCardHeader>
            <IonCardTitle>Add Relief Resource</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>

            <div>
              <div className="map-container">
                <div className="map-controls">
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
                <div ref={(el) => { if (el) mapRef.current = el; }} id="resource-map" className="map-embed" />
              </div>
              <small>Tap/click on the map to set resource location (lat, lng will populate)</small>
            </div>

            <IonItem>
              <IonLabel position="stacked">Location *</IonLabel>
              <div className="location-input-row">
                <IonInput value={location} readonly placeholder="Auto-filled from GPS or map click" />
                <IonButton
                  size="small"
                  onClick={handleGetCurrentLocation}
                  disabled={mapLoading}
                >
                  {mapLoading ? 'Getting Location...' : 'Get Current Location'}
                </IonButton>
              </div>
              {mapError && (
                <div className="location-error">
                  {mapError}
                </div>
              )}
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Address (optional)</IonLabel>
              <IonInput value={address} onIonInput={(e) => setAddress(e.detail.value!)} placeholder="Street, city or landmark" />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Contact info (email)</IonLabel>
              <IonInput value={contact} onIonInput={(e) => setContact(e.detail.value!)} placeholder="Email address (optional)" />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Contact phone</IonLabel>
              <IonInput value={contactPhone} onIonInput={(e) => setContactPhone(e.detail.value!)} placeholder="Phone number (optional)" />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Type of Resource *</IonLabel>
              <IonSelect value={resourceType} placeholder="Select type" onIonChange={e => setResourceType(e.detail.value!)}>
                <IonSelectOption value="food">Food Distribution</IonSelectOption>
                <IonSelectOption value="water">Water Supply</IonSelectOption>
                <IonSelectOption value="shelter">Shelter</IonSelectOption>
                <IonSelectOption value="medical">Medical Supplies</IonSelectOption>
                <IonSelectOption value="supplies">General Supplies</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Capacity (people served)</IonLabel>
              <IonInput
                type="number"
                value={capacity}
                onIonChange={(e) => setCapacity(e.detail.value ? parseInt(e.detail.value) : undefined)}
                placeholder="Number of people this resource can serve"
                min="0"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Current Availability</IonLabel>
              <IonSelect value={availability} onIonChange={(e) => setAvailability(e.detail.value)}>
                <IonSelectOption value="available">Available</IonSelectOption>
                <IonSelectOption value="limited">Limited</IonSelectOption>
                <IonSelectOption value="unavailable">Unavailable</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Details *</IonLabel>
              <IonTextarea value={details} onIonInput={(e) => setDetails(e.detail.value!)} rows={6} placeholder="Describe the resource, hours of operation, requirements, etc." />
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
            <IonButton expand="block" onClick={handleSubmit} className="submit-button" disabled={uploading}>Add Resource</IonButton>
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

export default ResourceForm;

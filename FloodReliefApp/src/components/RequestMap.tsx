import React, { useRef, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonText,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { refreshOutline, locate } from 'ionicons/icons';
import L from 'leaflet';
import { ReliefRequest } from './RequestCard';
import { useLocation } from '../hooks/useLocation';

interface RequestMapProps {
  requests: ReliefRequest[];
}

const RequestMap: React.FC<RequestMapProps> = ({ requests }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const {
    userCoords,
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    watching,
    refreshLocation,
    getCurrentLocation,
    startWatching,
    stopWatching,
    setUserCoords,
  } = useLocation();

  // Define map layers
  const mapLayers = {
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
  };

  const [currentLayer, setCurrentLayer] = React.useState<string>(() => {
    const saved = localStorage.getItem('preferred_map_layer');
    return saved || 'satellite';
  });

  // Initialize map when userCoords are available
  useEffect(() => {
    if (!userCoords || !mapRef.current) return;

    // Initialize map if not already done
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([userCoords.lat, userCoords.lng], 13);

      // Add the current layer to the map
      mapLayers[currentLayer as keyof typeof mapLayers].addTo(leafletMapRef.current);

      // Stop GPS watching when user pans or zooms the map
      leafletMapRef.current.on('dragstart', () => stopWatching());
      leafletMapRef.current.on('zoomstart', () => stopWatching());

      // Allow changing location by clicking on the map
      leafletMapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        stopWatching();
        setUserCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        leafletMapRef.current?.setView(e.latlng, leafletMapRef.current?.getZoom() || 13);
      });
    } else {
      // Update map view
      leafletMapRef.current.setView([userCoords.lat, userCoords.lng], leafletMapRef.current.getZoom() || 13);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => leafletMapRef.current?.removeLayer(marker));
    markersRef.current = [];

    // Add user location marker
    const userMarker = L.marker([userCoords.lat, userCoords.lng])
      .addTo(leafletMapRef.current)
      .bindPopup(`<strong>Your Location</strong><br /><span style="display: inline-block; margin-right: 4px;">🗺️</span><a href="https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}" target="_blank" rel="noopener noreferrer">${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}</a>`);
    markersRef.current.push(userMarker);

    // Add markers for all requests
    requests.forEach(request => {
      const marker = L.marker([request.lat, request.lng], { icon: getRequestTypeMapIcon(request.request_type) })
        .addTo(leafletMapRef.current!)
        .bindPopup(`
          <div style="max-width: 250px;">
            <strong>${request.location}</strong><br />
            <strong>Priority:</strong> ${request.priority}<br />
            <strong>Status:</strong> ${getStatusText(request.status || 'pending')}<br />
            ${request.distance_km ? `<strong>Distance:</strong> ${parseFloat(request.distance_km+""||"0").toFixed(1)} km<br />` : ''}
            ${request.request_type ? `<strong>Type:</strong> ${request.request_type}<br />` : ''}
            ${request.details ? `<strong>Details:</strong> ${request.details}<br />` : ''}
            ${request.address ? `<strong>Address:</strong> ${request.address}<br />` : ''}
            ${request.contact ? `<strong>Contact:</strong> ${request.contact}<br />` : ''}
            ${request.reporter_name ? `<strong>Reported by:</strong> ${request.reporter_name}<br />` : ''}
            ${request.reporter_phone ? `<strong>Reported by Phone:</strong> ${request.reporter_phone}<br />` : ''}
            <strong>Coordinates:</strong> <span style="display: inline-block; margin-right: 4px;">🗺️</span><a href="https://www.google.com/maps?q=${request.lat},${request.lng}" target="_blank" rel="noopener noreferrer">${request.lat.toFixed(6)}, ${request.lng.toFixed(6)}</a><br />
            ${(request.photos && request.photos.length > 0) ? `<strong>Photos:</strong> ${request.photos.length} attached<br />`+request.photos.map(photo => `<img src="${photo}" alt="Photo" style="max-width: 50px;" /><br>`).join('') : ''}
            ${(request.videos && request.videos.length > 0) ? `<strong>Videos:</strong> ${request.videos.length} attached<br />` : ''}
            <small>${request.timestamp.toLocaleString()}</small>
            <br /><button onclick="window.openRequestModal && window.openRequestModal(${JSON.stringify(request).replace(/"/g, '&quot;')})" style="margin-top: 10px; padding: 5px 10px; background: #3880ff; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
          </div>
        `);
      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach(marker => leafletMapRef.current?.removeLayer(marker));
      markersRef.current = [];
    };
  }, [userCoords, requests]);

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

  // Cleanup map on component unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off('dragstart');
          leafletMapRef.current.off('zoomstart');
          leafletMapRef.current.off('click');
        } catch {}
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  const getRequestTypeMapIcon = (requestType?: string) => {
    const getColor = () => {
      switch (requestType?.toLowerCase()) {
        case 'medical': return '#eb445a';
        case 'food': return '#ffc409';
        case 'shelter': return '#3880ff';
        case 'water': return '#5260ff';
        case 'supplies': return '#3dc2ff';
        default: return '#92949c';
      }
    };

    const getIconSvg = () => {
      switch (requestType?.toLowerCase()) {
        case 'medical':
          return `<path d="M8 6h2v4h4v2h-4v4h-2v-4h-4v-2h4z"/>`;
        case 'food':
          return `<path d="M7 4h2v2h2v2h-2v6h-2v-6h-2v-2h2z"/><path d="M9 14h2v2h-2z"/>`;
        case 'shelter':
          return `<path d="M6 8l3-3h6l3 3v8h-12z"/><path d="M8 16h8v2h-8z"/>`;
        case 'water':
          return `<path d="M8 4c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.4-1 1.7v2.3h2v2h-6v-2h2v-2.3c-.6-.3-1-1-1-1.7z"/><path d="M12 12h-2v-2h2z"/>`;
        case 'supplies':
          return `<path d="M6 6h8v8h-8z"/><path d="M8 8h4v4h-4z"/>`;
        default:
          return `<circle cx="10" cy="10" r="3"/>`;
      }
    };

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" fill="${getColor()}" stroke="#fff" stroke-width="1"/>
          <g fill="#fff" transform="translate(0, 0)">
            ${getIconSvg()}
          </g>
        </svg>
      `)}`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [20, 20]
    });
  };

  return (
    <div className="map-container">
      <div className="map-meta">
        <div>
          {accuracy !== null && <small>Accuracy: {Math.round(accuracy)} m</small>}
          {lastUpdated && <small>Updated: {lastUpdated.toLocaleTimeString()}</small>}
        </div>
        <div>
          <IonButton size="small" onClick={refreshLocation}>
            <IonIcon icon={refreshOutline} />
            Refresh
          </IonButton>
          <IonButton
            size="small"
            onClick={async () => { await getCurrentLocation(); startWatching(); }}
            style={{ marginLeft: 8 }}
          >
            <IonIcon icon={locate} />
            Current Location
          </IonButton>
          <select
            value={currentLayer}
            onChange={(e) => setCurrentLayer(e.target.value)}
            className="layer-select"
            title="Choose map layer"
          >
            <option value="satellite">🛰️ Satellite</option>
            <option value="streets">🗺️ Streets</option>
          </select>
        </div>
      </div>

      {mapError ? (
        <IonCard>
          <IonCardContent>
            <IonText color="danger">
              <p>{mapError}</p>
            </IonText>
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
      <div className="map-refresh-note">
        <IonText color="medium">
          <small>(if maps are not visible properly, hit refresh button)</small>
        </IonText>
      </div>
    </div>
  );
};

export default RequestMap;

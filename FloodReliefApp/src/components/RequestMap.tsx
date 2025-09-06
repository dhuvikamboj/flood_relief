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
import { MAP_LAYERS, MapLayerKey, getMapLayerPreference, saveMapLayerPreference } from '../utils/mapLayers';

interface RequestMapProps {
  requests: ReliefRequest[];
  isVisible?: boolean;
}

const RequestMap: React.FC<RequestMapProps> = ({ requests, isVisible = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isPageVisible, setIsPageVisible] = React.useState<boolean>(!document.hidden);

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

  const [currentLayer, setCurrentLayer] = React.useState<MapLayerKey>(() => {
    return getMapLayerPreference();
  });

  // Save layer preference when it changes
  useEffect(() => {
    saveMapLayerPreference(currentLayer);
  }, [currentLayer]);

  // Page visibility detection for navigation handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (visible && isVisible && leafletMapRef.current) {
        // Page became visible - likely returned from navigation
        setTimeout(() => {
          try {
            leafletMapRef.current?.invalidateSize(true);
            const center = leafletMapRef.current?.getCenter();
            if (center) {
              leafletMapRef.current?.setView(center, leafletMapRef.current?.getZoom());
            }
          } catch (error) {
            console.warn('Error refreshing map after navigation:', error);
          }
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible]);

  // Layer validation effect - ensures layers are present after navigation
  useEffect(() => {
    if (isVisible && isPageVisible && leafletMapRef.current) {
      // Check if any tile layer is present, if not add the current one
      const hasAnyTileLayer = Object.values(MAP_LAYERS).some(layer => 
        leafletMapRef.current?.hasLayer(layer)
      );
      
      if (!hasAnyTileLayer) {
        console.log('No tile layer detected after navigation, adding current layer');
        try {
          MAP_LAYERS[currentLayer].addTo(leafletMapRef.current);
        } catch (error) {
          console.warn('Error adding layer after navigation:', error);
        }
      }
    }
  }, [isVisible, isPageVisible, currentLayer]);

  // Handle visibility changes - invalidate map size when becoming visible
  useEffect(() => {
    if (isVisible && leafletMapRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        try {
          leafletMapRef.current?.invalidateSize();
          // Force a redraw by slightly moving the view
          const center = leafletMapRef.current?.getCenter();
          if (center) {
            leafletMapRef.current?.setView(center, leafletMapRef.current?.getZoom());
          }
        } catch (error) {
          console.warn('Error invalidating map size:', error);
        }
      }, 150);
    }
  }, [isVisible]);

  // Additional effect to handle map container size issues after navigation
  useEffect(() => {
    if (isVisible && leafletMapRef.current && userCoords) {
      // Additional delay to handle navigation-related issues
      const timer = setTimeout(() => {
        try {
          if (leafletMapRef.current && mapRef.current) {
            // Check if container has proper dimensions
            const container = mapRef.current;
            const rect = container.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              leafletMapRef.current.invalidateSize(true);
              leafletMapRef.current.setView([userCoords.lat, userCoords.lng], leafletMapRef.current.getZoom() || 13);
            } else {
              // Container not ready, try again
              setTimeout(() => {
                if (leafletMapRef.current) {
                  leafletMapRef.current.invalidateSize(true);
                }
              }, 300);
            }
          }
        } catch (error) {
          console.warn('Error in navigation map fix:', error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isVisible, userCoords]);

  // Initialize map when userCoords are available
  useEffect(() => {
    if (!userCoords || !mapRef.current) return;

    // Don't initialize map if container is hidden - wait until visible
    if (!isVisible) return;

    // Check if container has proper dimensions before initializing
    const container = mapRef.current;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Container not ready, wait a bit and try again
      const timer = setTimeout(() => {
        if (mapRef.current && isVisible) {
          const newRect = mapRef.current.getBoundingClientRect();
          if (newRect.width > 0 && newRect.height > 0) {
            // Trigger this effect again by updating current layer
            setCurrentLayer(currentLayer);
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }

    // Initialize map if not already done
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([userCoords.lat, userCoords.lng], 13);

      // Add the current layer to the map with retry logic
      try {
        MAP_LAYERS[currentLayer].addTo(leafletMapRef.current);
      } catch (error) {
        console.warn('Error adding initial layer, will retry:', error);
        // Retry after a short delay
        setTimeout(() => {
          try {
            if (leafletMapRef.current && !leafletMapRef.current.hasLayer(MAP_LAYERS[currentLayer])) {
              MAP_LAYERS[currentLayer].addTo(leafletMapRef.current);
            }
          } catch (retryError) {
            console.warn('Retry failed for adding layer:', retryError);
          }
        }, 100);
      }

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

    // Clear existing markers with error handling
    markersRef.current.forEach(marker => {
      try {
        if (leafletMapRef.current && leafletMapRef.current.hasLayer(marker)) {
          leafletMapRef.current.removeLayer(marker);
        }
      } catch (error) {
        console.warn('Error removing existing marker:', error);
      }
    });
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
            <strong>${request.location}</strong> <span style="color: #666; font-size: 0.8em;">(ID: ${request.id})</span><br />
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
      // Cleanup markers on unmount with error handling
      markersRef.current.forEach(marker => {
        try {
          if (leafletMapRef.current && leafletMapRef.current.hasLayer(marker)) {
            leafletMapRef.current.removeLayer(marker);
          }
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      markersRef.current = [];
    };
  }, [userCoords, requests, isVisible]);

  // Handle layer changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Skip layer changes if not visible to avoid issues
    if (!isVisible) return;

    // Remove all existing tile layers with error handling
    Object.values(MAP_LAYERS).forEach(layer => {
      try {
        if (leafletMapRef.current && leafletMapRef.current.hasLayer(layer)) {
          leafletMapRef.current.removeLayer(layer);
        }
      } catch (error) {
        console.warn('Error removing tile layer:', error);
      }
    });

    // Add the new layer with error handling and validation
    try {
      if (leafletMapRef.current && MAP_LAYERS[currentLayer]) {
        // Ensure the layer isn't already added
        if (!leafletMapRef.current.hasLayer(MAP_LAYERS[currentLayer])) {
          MAP_LAYERS[currentLayer].addTo(leafletMapRef.current);
        }
      }
    } catch (error) {
      console.warn('Error adding tile layer:', error);
      // Retry after a short delay
      setTimeout(() => {
        try {
          if (leafletMapRef.current && MAP_LAYERS[currentLayer] && 
              !leafletMapRef.current.hasLayer(MAP_LAYERS[currentLayer])) {
            MAP_LAYERS[currentLayer].addTo(leafletMapRef.current);
          }
        } catch (retryError) {
          console.warn('Retry failed for layer change:', retryError);
        }
      }, 200);
    }
  }, [currentLayer, isVisible]);

  // Cleanup map on component unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        try {
          // Remove all markers first
          markersRef.current.forEach(marker => {
            try {
              if (leafletMapRef.current && leafletMapRef.current.hasLayer(marker)) {
                leafletMapRef.current.removeLayer(marker);
              }
            } catch (error) {
              console.warn('Error removing marker during cleanup:', error);
            }
          });
          markersRef.current = [];

          // Remove event listeners
          leafletMapRef.current.off('dragstart');
          leafletMapRef.current.off('zoomstart');
          leafletMapRef.current.off('click');
          
          // Remove the map
          leafletMapRef.current.remove();
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        } finally {
          leafletMapRef.current = null;
        }
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
          <IonButton size="small" onClick={()=>{
            window.location.reload();
          }}>
            <IonIcon icon={refreshOutline} />
            Refresh
          </IonButton>
          <IonButton
            size="small"
            onClick={async () => { try { await startWatching(); } catch {} }}
            style={{ marginLeft: 8 }}
          >
            <IonIcon icon={locate} />
            Current Location
          </IonButton>
          <select
            value={currentLayer}
            onChange={(e) => setCurrentLayer(e.target.value as MapLayerKey)}
            className="layer-select"
            title="Choose map layer"
          >
            <option value="satellite">🛰️ Satellite</option>
            <option value="streets">🗺️ Streets</option>
            <option value="terrain">🏔️ Terrain</option>
            <option value="topo">📍 Topographic</option>
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
      <div className="map-refresh-note">
        <IonText color="medium">
          <small>(if maps are not visible properly, hit refresh button)</small>
        </IonText>
      </div>
    </div>
  );
};

export default RequestMap;

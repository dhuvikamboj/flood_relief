import { useEffect, useMemo } from 'react';
import { useMap, UseMapOptions } from './useMap';
import { ReliefRequest } from '../components/RequestCard';
import { MapMarker, MapCoordinates } from '../providers/map/mapTypes';
import { 
  generateRequestTypeIcon, 
  getRequestTypeColor 
} from '../config/mapConfig';
import { useTranslation } from 'react-i18next';

export interface UseRequestMapOptions extends UseMapOptions {
  onRequestClick?: (request: ReliefRequest) => void;
}

export function useRequestMap(
  requests: ReliefRequest[], 
  isVisible: boolean = true,
  options: UseRequestMapOptions = {}
) {
  const { t } = useTranslation();
  const { onRequestClick, ...mapOptions } = options;
  
  const {
    mapRef,
    mapInstance,
    isReady,
    error,
    currentLayer,
    setCurrentLayer,
    addMarker,
    removeMarker,
    clearMarkers,
    clearDataMarkers,
    setView,
    getCenter,
    getZoom,
    refresh
  } = useMap(isVisible, {
    preset: 'display',
    ...mapOptions
  });

  // Convert requests to markers
  const requestMarkers = useMemo(() => {
    return requests.map(request => {
      const marker: MapMarker = {
        id: `request-${request.id}`,
        coordinates: { lat: request.lat, lng: request.lng },
        data: request,
        popupContent: generateRequestPopupContent(request, t),
        options: {
          icon: {
            url: generateRequestIconDataUrl(request),
            size: [20, 20],
            anchor: [10, 10],
            popupAnchor: [0, -10],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [20, 20]
          }
        }
      };

      return marker;
    });
  }, [requests, t]);

  // Update markers when requests change
  useEffect(() => {
    if (!isReady || !mapInstance) return;

    // Clear existing data markers (preserves user location)
    clearDataMarkers();

    // Add new markers
    requestMarkers.forEach(marker => {
      try {
        addMarker(marker);
      } catch (error) {
        console.warn('Failed to add request marker:', error);
      }
    });

    // Setup click handlers
    if (onRequestClick) {
      // Note: This would need to be implemented in the MapInstance
      // For now, we rely on the popup content having click handlers
    }

  }, [requestMarkers, isReady, mapInstance, addMarker, clearDataMarkers, onRequestClick]);

  return {
    mapRef,
    mapInstance,
    isReady,
    error,
    currentLayer,
    setCurrentLayer,
    setView,
    getCenter,
    getZoom,
    refresh
  };
}

// Helper function to generate request popup content
function generateRequestPopupContent(request: ReliefRequest, t: any): string {
  return `
    <div style="max-width: 250px;">
      <strong>${request.location}</strong> 
      <span style="color: #666; font-size: 0.8em;">(ID: ${request.id})</span><br />
      
      <strong>${t('map.priorityLabel')}</strong> ${request.priority}<br />
      <strong>${t('map.requestType')}</strong> ${request.request_type}<br />
      <strong>${t('map.statusLabel')}</strong> ${request.status}<br />
      
      ${request.address ? `<strong>${t('map.address')}</strong> ${request.address}<br />` : ''}
      ${request.contact ? `<strong>${t('map.contact')}</strong> ${request.contact}<br />` : ''}
      ${request.details ? `<strong>${t('map.details')}</strong> ${request.details.substring(0, 100)}${request.details.length > 100 ? '...' : ''}<br />` : ''}
      
      <strong>${t('map.coordinatesLabel')}</strong> 
      <span style="display: inline-block; margin-right: 4px;">🗺️</span>
      <a href="https://www.google.com/maps?q=${request.lat},${request.lng}" target="_blank" rel="noopener noreferrer">
        ${request.lat.toFixed(6)}, ${request.lng.toFixed(6)}
      </a><br />
      
      ${request.photos && request.photos.length > 0 ? 
        `<strong>${t('map.photos')}</strong> ${request.photos.length} attached<br />` +
        request.photos.map(photo => `<img src="${photo}" alt="${t('map.photoAlt', {index: 1})}" style="max-width: 50px;" /><br>`).join('') 
        : ''
      }
      ${request.videos && request.videos.length > 0 ? 
        `<strong>${t('map.videos')}</strong> ${request.videos.length} attached<br />` 
        : ''
      }
      
      <small>${request.timestamp.toLocaleString()}</small>
      
      <br /><button 
        onclick="window.openRequestModal && window.openRequestModal(${JSON.stringify(request).replace(/"/g, '&quot;')})" 
        style="margin-top: 10px; padding: 5px 10px; background: #3880ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ${t('map.viewDetails')}
      </button>
    </div>
  `;
}

// Helper function to generate request icon data URL
function generateRequestIconDataUrl(request: ReliefRequest): string {
  const iconColor = getRequestTypeColor(request.request_type);
  const iconSvg = generateRequestTypeIcon(request.request_type);
  
  const svg = `
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill="${iconColor}" stroke="#fff" stroke-width="1"/>
      <g fill="#fff" transform="translate(0, 0)">
        ${iconSvg}
      </g>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default useRequestMap;

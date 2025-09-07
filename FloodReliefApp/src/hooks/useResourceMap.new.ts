import { useEffect, useMemo } from 'react';
import { useMap, UseMapOptions } from './useMap';
import { ReliefResource } from '../types/resource';
import { MapMarker, MapCoordinates } from '../providers/map/mapTypes';
import { 
  generateResourceTypeIcon, 
  getResourceTypeColor,
  getAvailabilityColor
} from '../config/mapConfig';
import { getAvailabilityText } from '../utils/resourceUtils';
import { useTranslation } from 'react-i18next';

export interface UseResourceMapOptions extends UseMapOptions {
  onResourceClick?: (resource: ReliefResource) => void;
}

export function useResourceMap(
  resources: ReliefResource[], 
  isVisible: boolean = true,
  options: UseResourceMapOptions = {}
) {
  const { t } = useTranslation();
  const { onResourceClick, ...mapOptions } = options;
  
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

  // Convert resources to markers
  const resourceMarkers = useMemo(() => {
    return resources.map(resource => {
      const marker: MapMarker = {
        id: `resource-${resource.id}`,
        coordinates: { lat: resource.lat, lng: resource.lng },
        data: resource,
        popupContent: generateResourcePopupContent(resource, t),
        options: {
          icon: {
            url: generateResourceIconDataUrl(resource),
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
  }, [resources, t]);

  // Update markers when resources change
  useEffect(() => {
    if (!isReady || !mapInstance) return;

    // Clear existing data markers (preserves user location)
    clearDataMarkers();

    // Add new markers
    resourceMarkers.forEach(marker => {
      try {
        addMarker(marker);
      } catch (error) {
        console.warn('Failed to add resource marker:', error);
      }
    });

    // Setup click handlers
    if (onResourceClick) {
      // Note: This would need to be implemented in the MapInstance
      // For now, we rely on the popup content having click handlers
    }

  }, [resourceMarkers, isReady, mapInstance, addMarker, clearDataMarkers, onResourceClick]);

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

// Helper function to generate resource popup content
function generateResourcePopupContent(resource: ReliefResource, t: any): string {
  const availabilityText = getAvailabilityText(resource.availability);
  
  return `
    <div style="max-width: 250px;">
      <strong>${resource.location || `${resource.lat.toFixed(6)}, ${resource.lng.toFixed(6)}`}</strong> 
      <span style="color: #666; font-size: 0.8em;">(ID: ${resource.id})</span><br />
      
      <strong>${t('map.resourceType')}</strong> ${resource.resource_type}<br />
      <strong>${t('map.availability')}</strong> ${availabilityText}<br />
      
      ${resource.capacity ? `<strong>${t('map.capacity')}</strong> ${resource.capacity}<br />` : ''}
      ${resource.address ? `<strong>${t('map.address')}</strong> ${resource.address}<br />` : ''}
      ${resource.contact ? `<strong>${t('map.contact')}</strong> ${resource.contact}<br />` : ''}
      ${resource.details ? `<strong>${t('map.details')}</strong> ${resource.details.substring(0, 100)}${resource.details.length > 100 ? '...' : ''}<br />` : ''}
      
      <strong>${t('map.coordinatesLabel')}</strong> 
      <span style="display: inline-block; margin-right: 4px;">🗺️</span>
      <a href="https://www.google.com/maps?q=${resource.lat},${resource.lng}" target="_blank" rel="noopener noreferrer">
        ${resource.lat.toFixed(6)}, ${resource.lng.toFixed(6)}
      </a><br />
      
      ${resource.photos && resource.photos.length > 0 ? 
        `<strong>${t('map.photos')}</strong> ${resource.photos.length} attached<br />` +
        resource.photos.map(photo => `<img src="${photo}" alt="${t('map.photoAlt', {index: 1})}" style="max-width: 50px;" /><br>`).join('') 
        : ''
      }
      ${resource.videos && resource.videos.length > 0 ? 
        `<strong>${t('map.videos')}</strong> ${resource.videos.length} attached<br />` 
        : ''
      }
      
      <small>${new Date(resource.timestamp).toLocaleString()}</small>
      
      <br /><button 
        onclick="window.openResourceModal && window.openResourceModal(${JSON.stringify(resource).replace(/"/g, '&quot;')})" 
        style="margin-top: 10px; padding: 5px 10px; background: #3880ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ${t('map.viewDetails')}
      </button>
    </div>
  `;
}

// Helper function to generate resource icon data URL
function generateResourceIconDataUrl(resource: ReliefResource): string {
  const iconColor = getResourceTypeColor(resource.resource_type);
  const iconSvg = generateResourceTypeIcon(resource.resource_type);
  
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

export default useResourceMap;

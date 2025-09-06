import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ReliefResource } from '../types/resource';
import { useLocation } from './useLocation';
import { getAvailabilityText } from '../utils/resourceUtils';

export const useResourceMap = (resources: ReliefResource[], isVisible: boolean = true) => {
  const {
    userCoords,
    stopWatching,
    setUserCoords,
  } = useLocation();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const initializationAttempts = useRef<number>(0);
  const lastNavigationTime = useRef<number>(0);
  
  const [currentLayer, setCurrentLayer] = useState<string>(() => {
    const saved = localStorage.getItem('preferred_map_layer');
    return saved || 'satellite';
  });

  // Track page visibility for navigation detection
  const [isPageVisible, setIsPageVisible] = useState<boolean>(!document.hidden);

  // Page visibility detection for navigation handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (visible && isVisible) {
        // Page became visible - likely returned from navigation
        lastNavigationTime.current = Date.now();
        
        // Reset map if it exists and needs refresh
        if (leafletMapRef.current) {
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
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible]);

  // Layer validation effect - ensures layers are present after navigation
  useEffect(() => {
    if (isVisible && isPageVisible && leafletMapRef.current) {
      // Check if any tile layer is present, if not add the current one
      const hasAnyTileLayer = Object.values(mapLayers).some(layer => 
        leafletMapRef.current?.hasLayer(layer)
      );
      
      if (!hasAnyTileLayer) {
        console.log('No tile layer detected on resource map after navigation, adding current layer');
        try {
          mapLayers[currentLayer as keyof typeof mapLayers].addTo(leafletMapRef.current);
        } catch (error) {
          console.warn('Error adding layer to resource map after navigation:', error);
        }
      }
    }
  }, [isVisible, isPageVisible, currentLayer]);

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

  const getAvailabilityIconColor = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available': return '#10dc60'; // success color
      case 'limited': return '#ffce00'; // warning color
      case 'unavailable': return '#f04141'; // danger color
      default: return '#92949c'; // medium color
    }
  };

  const getResourceTypeColor = (resourceType?: string) => {
    switch (resourceType?.toLowerCase()) {
      case 'food': return 'warning';
      case 'medical': return 'danger';
      case 'shelter': return 'primary';
      case 'water': return 'tertiary';
      case 'supplies': return 'secondary';
      default: return 'medium';
    }
  };

  const getResourceTypeMapIcon = (resourceType?: string) => {
    const color = getResourceTypeColor(resourceType);
    let iconColor = '#3880ff'; // default blue
    let iconSvg = '';

    switch (resourceType?.toLowerCase()) {
      case 'food':
        iconColor = '#ffc409'; // yellow
        iconSvg = `<path d="M7 4h2v2h2v2h-2v6h-2v-6h-2v-2h2z"/><path d="M9 14h2v2h-2z"/>`;
        break;
      case 'medical':
        iconColor = '#eb445a'; // red
        iconSvg = `<path d="M8 6h2v4h4v2h-4v4h-2v-4h-4v-2h4z"/>`;
        break;
      case 'shelter':
        iconColor = '#3880ff'; // blue
        iconSvg = `<path d="M6 8l3-3h6l3 3v8h-12z"/><path d="M8 16h8v2h-8z"/>`;
        break;
      case 'water':
        iconColor = '#5260ff'; // purple
        iconSvg = `<path d="M8 4c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.4-1 1.7v2.3h2v2h-6v-2h2v-2.3c-.6-.3-1-1-1-1.7z"/><path d="M12 12h-2v-2h2z"/>`;
        break;
      case 'supplies':
        iconColor = '#3dc2ff'; // light blue
        iconSvg = `<path d="M6 6h8v8h-8z"/><path d="M8 8h4v4h-4z"/>`;
        break;
      default:
        iconColor = '#92949c'; // gray
        iconSvg = `<circle cx="10" cy="10" r="3"/>`;
        break;
    }

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" fill="${iconColor}" stroke="#fff" stroke-width="1"/>
          <g fill="#fff" transform="translate(0, 0)">
            ${iconSvg}
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



  // Handle visibility changes - invalidate map size when becoming visible
  useEffect(() => {
    if (isVisible && leafletMapRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        try {
          leafletMapRef.current?.invalidateSize(true);
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

  // Enhanced navigation handling with robust container checks
  useEffect(() => {
    if (!isVisible || !leafletMapRef.current || !userCoords) return;

    const handleNavigationRefresh = () => {
      try {
        if (leafletMapRef.current && mapRef.current) {
          // Check if container has proper dimensions
          const container = mapRef.current;
          const rect = container.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            // Container is ready
            leafletMapRef.current.invalidateSize(true);
            leafletMapRef.current.setView([userCoords.lat, userCoords.lng], leafletMapRef.current.getZoom() || 13);
            
            // Force refresh by removing and re-adding the current layer
            const currentTileLayer = mapLayers[currentLayer as keyof typeof mapLayers];
            if (leafletMapRef.current.hasLayer(currentTileLayer)) {
              leafletMapRef.current.removeLayer(currentTileLayer);
              currentTileLayer.addTo(leafletMapRef.current);
            }
          } else {
            // Container not ready, try again with exponential backoff
            initializationAttempts.current++;
            if (initializationAttempts.current < 5) {
              const delay = Math.min(200 * Math.pow(2, initializationAttempts.current), 2000);
              setTimeout(handleNavigationRefresh, delay);
            }
          }
        }
      } catch (error) {
        console.warn('Error in navigation map refresh:', error);
      }
    };

    // Check if this might be a post-navigation scenario
    const timeSinceNavigation = Date.now() - lastNavigationTime.current;
    const isRecentNavigation = timeSinceNavigation < 1000; // Within last second
    
    if (isRecentNavigation || initializationAttempts.current > 0) {
      // Reset attempts counter for new navigation
      if (isRecentNavigation) {
        initializationAttempts.current = 0;
      }
      
      // Use longer delay for navigation scenarios
      const delay = isRecentNavigation ? 300 : 150;
      setTimeout(handleNavigationRefresh, delay);
    } else {
      // Normal visibility change, shorter delay
      setTimeout(handleNavigationRefresh, 100);
    }
  }, [isVisible, userCoords, isPageVisible]);

  // Robust container readiness check function
  const isContainerReady = (): boolean => {
    if (!mapRef.current) return false;
    
    const rect = mapRef.current.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const hasContent = mapRef.current.offsetWidth > 0 && mapRef.current.offsetHeight > 0;
    
    return isVisible && hasContent;
  };

  // Initialize map when userCoords are available - enhanced for navigation
  useEffect(() => {
    if (!userCoords || !mapRef.current) return;

    // Don't initialize map if container is hidden - wait until visible
    if (!isVisible) return;

    // Enhanced container readiness check
    if (!isContainerReady()) {
      // Container not ready, wait and try again with exponential backoff
      initializationAttempts.current++;
      if (initializationAttempts.current < 6) {
        const delay = Math.min(100 * Math.pow(1.5, initializationAttempts.current), 1000);
        const timer = setTimeout(() => {
          // Trigger this effect again by updating state
          setCurrentLayer(currentLayer);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        console.warn('Map container failed to become ready after multiple attempts');
        return;
      }
    }

    // Reset attempts counter when container is ready
    initializationAttempts.current = 0;

    // Initialize map if not already done or if it needs re-initialization
    const needsInitialization = !leafletMapRef.current || 
      !leafletMapRef.current.getContainer() ||
      !leafletMapRef.current.getContainer().parentNode;

    if (needsInitialization) {
      // Clean up existing map if it exists but is detached
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off('dragstart');
          leafletMapRef.current.off('zoomstart');
          leafletMapRef.current.off('click');
          leafletMapRef.current.remove();
        } catch (error) {
          console.warn('Error cleaning up existing map:', error);
        }
      }

      // Create new map instance
      leafletMapRef.current = L.map(mapRef.current).setView([userCoords.lat, userCoords.lng], 13);

      // Add the current layer to the map with retry logic
      try {
        mapLayers[currentLayer as keyof typeof mapLayers].addTo(leafletMapRef.current);
      } catch (error) {
        console.warn('Error adding initial layer to resource map, will retry:', error);
        setTimeout(() => {
          try {
            if (leafletMapRef.current && 
                !leafletMapRef.current.hasLayer(mapLayers[currentLayer as keyof typeof mapLayers])) {
              mapLayers[currentLayer as keyof typeof mapLayers].addTo(leafletMapRef.current);
            }
          } catch (retryError) {
            console.warn('Retry failed for adding resource map layer:', retryError);
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
      // Update existing map view
      try {
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([userCoords.lat, userCoords.lng], leafletMapRef.current.getZoom() || 13);
        }
      } catch (error) {
        console.warn('Error updating map view:', error);
      }
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
    if (leafletMapRef.current) {
      const userMarker = L.marker([userCoords.lat, userCoords.lng])
        .addTo(leafletMapRef.current)
        .bindPopup(`<strong>Your Location</strong><br /><span style="display: inline-block; margin-right: 4px;">🗺️</span><a href="https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}" target="_blank" rel="noopener noreferrer">${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}</a>`);
      markersRef.current.push(userMarker);

      // Add markers for all resources
      resources.forEach(resource => {
        if (leafletMapRef.current) {
          const marker = L.marker([resource.lat, resource.lng], { icon: getResourceTypeMapIcon(resource.resource_type) })
            .addTo(leafletMapRef.current)
            .bindPopup(`
              <div style="max-width: 250px;">
                <strong>${resource.location}</strong> <span style="color: #666; font-size: 0.8em;">(ID: ${resource.id})</span><br />
                <strong style="color: ${getAvailabilityIconColor(resource.availability)};">● ${getAvailabilityText(resource.availability)}</strong><br />
                ${resource.distance_km ? `<strong>Distance:</strong> ${parseFloat(resource.distance_km+""||"0").toFixed(1)} km<br />` : ''}
                ${resource.resource_type ? `<strong>Type:</strong> ${resource.resource_type}<br />` : ''}
                ${resource.capacity ? `<strong>Capacity:</strong> ${resource.capacity}<br />` : ''}
                ${resource.details ? `<strong>Details:</strong> ${resource.details}<br />` : ''}
                ${resource.address ? `<strong>Address:</strong> ${resource.address}<br />` : ''}
                ${resource.contact ? `<strong>Contact:</strong> ${resource.contact}<br />` : ''}
                ${resource.reporter_name ? `<strong>Provided by:</strong> ${resource.reporter_name}<br />` : ''}
                ${resource.reporter_phone ? `<strong>Phone:</strong> ${resource.reporter_phone}<br />` : ''}
                <strong>Coordinates:</strong> <span style="display: inline-block; margin-right: 4px;">🗺️</span><a href="https://www.google.com/maps?q=${resource.lat},${resource.lng}" target="_blank" rel="noopener noreferrer">${resource.lat.toFixed(6)}, ${resource.lng.toFixed(6)}</a><br />
                ${(resource.photos && resource.photos.length > 0) ? `<strong>Photos:</strong> ${resource.photos.length} attached<br />`+resource.photos.map(photo => `<img src="${photo}" alt="Photo" style="max-width: 100%;" /><br>`).join('') : ''}
                ${(resource.videos && resource.videos.length > 0) ? `<strong>Videos:</strong> ${resource.videos.length} attached<br />` : ''}
                <small>${resource.timestamp.toLocaleString()}</small>
                <br /><button onclick="window.openResourceModal && window.openResourceModal(${JSON.stringify(resource).replace(/"/g, '&quot;')})" style="margin-top: 10px; padding: 5px 10px; background: #3880ff; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
              </div>
            `);
          markersRef.current.push(marker);
        }
      });
    }

    return () => {
      // Cleanup markers on unmount with error handling
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
    };
  }, [userCoords, resources, isVisible]);

  // Handle layer changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Skip layer changes if not visible to avoid issues
    if (!isVisible) return;

    // Remove all existing tile layers with error handling
    Object.values(mapLayers).forEach(layer => {
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
      if (leafletMapRef.current && mapLayers[currentLayer as keyof typeof mapLayers]) {
        const newLayer = mapLayers[currentLayer as keyof typeof mapLayers];
        // Ensure the layer isn't already added
        if (!leafletMapRef.current.hasLayer(newLayer)) {
          newLayer.addTo(leafletMapRef.current);
        }
      }
    } catch (error) {
      console.warn('Error adding tile layer:', error);
      // Retry after a short delay
      setTimeout(() => {
        try {
          if (leafletMapRef.current && mapLayers[currentLayer as keyof typeof mapLayers] && 
              !leafletMapRef.current.hasLayer(mapLayers[currentLayer as keyof typeof mapLayers])) {
            mapLayers[currentLayer as keyof typeof mapLayers].addTo(leafletMapRef.current);
          }
        } catch (retryError) {
          console.warn('Retry failed for resource map layer change:', retryError);
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
              console.warn('Error removing marker during final cleanup:', error);
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

  return {
    mapRef,
    currentLayer,
    setCurrentLayer,
  };
};

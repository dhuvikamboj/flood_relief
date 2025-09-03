import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonToast,
  IonText,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonItem,
  IonLabel,
  IonRange,
  IonBadge,
  IonModal,
  IonImg,
  IonChip,
  IonAlert
} from '@ionic/react';
import { add, location as locationIcon, warning, trash, checkmark, checkmarkDone, call, person, medkit, restaurant, home, water, briefcase, map } from 'ionicons/icons';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Reports.css';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Comment {
  id: number;
  comment: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ReliefResource {
  id: number;
  location: string;
  address?: string;
  contact?: string;
  contact_phone?: string;
  resource_type?: string;
  details: string;
  capacity?: number;
  availability: string;
  distance_km?: number;
  timestamp: Date;
  lat: number;
  lng: number;
  photos?: string[];
  videos?: string[];
  user_id?: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  comments?: Comment[];
}

  const ReliefResources: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAvailabilityAlert, setShowAvailabilityAlert] = useState(false);
  const [pendingAvailabilityUpdate, setPendingAvailabilityUpdate] = useState<{ resourceId: number; newAvailability: string } | null>(null);    // Use the location hook
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

    // Use the auth hook
    const { user, isAuthenticated } = useAuth();

    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [resources, setResources] = useState<ReliefResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(() => {
    const saved = localStorage.getItem('preferred_search_radius');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('available');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [myResourcesFilter, setMyResourcesFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('distance_km');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedResources = useMemo(() => {
    return [...resources].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'distance_km':
          aVal = a.distance_km || 0;
          bVal = b.distance_km || 0;
          break;
        case 'capacity':
          aVal = a.capacity || 0;
          bVal = b.capacity || 0;
          break;
        case 'availability':
          const availabilityOrder = { 'available': 3, 'limited': 2, 'unavailable': 1 };
          aVal = availabilityOrder[a.availability as keyof typeof availabilityOrder] || 0;
          bVal = availabilityOrder[b.availability as keyof typeof availabilityOrder] || 0;
          break;
        case 'timestamp':
          aVal = a.timestamp.getTime();
          bVal = b.timestamp.getTime();
          break;
        default:
          return 0;
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [resources, sortBy, sortOrder]);
  const [currentLayer, setCurrentLayer] = useState<string>(() => {
    const saved = localStorage.getItem('preferred_map_layer');
    return saved || 'satellite';
  });
  const [selectedResource, setSelectedResource] = useState<ReliefResource | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Save radius to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('preferred_search_radius', searchRadius.toString());
  }, [searchRadius]);

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
      leafletMapRef.current.setView([userCoords.lat, userCoords.lng], 16);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => leafletMapRef.current?.removeLayer(marker));
    markersRef.current = [];

    // Add user location marker
    const userMarker = L.marker([userCoords.lat, userCoords.lng])
      .addTo(leafletMapRef.current)
      .bindPopup(`<strong>Your Location</strong><br /><span style="display: inline-block; margin-right: 4px;">🗺️</span><a href="https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}" target="_blank" rel="noopener noreferrer">${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}</a>`);
    markersRef.current.push(userMarker);

    // Add markers for all resources
    resources.forEach(resource => {
      const marker = L.marker([resource.lat, resource.lng], { icon: getResourceTypeMapIcon(resource.resource_type) })
        .addTo(leafletMapRef.current!)
        .bindPopup(`
          <div style="max-width: 250px;">
            <strong>${resource.location}</strong><br />
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
    });

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach(marker => leafletMapRef.current?.removeLayer(marker));
      markersRef.current = [];
    };
  }, [userCoords, resources]);

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

  useEffect(() => {
    (window as any).openResourceModal = openResourceModal;
  }, []);

    // fetch nearby resources when coords available
    useEffect(() => {
      if (!userCoords) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        setLoadingResources(true);
        try {
          const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';

          let url: string;
          if (myResourcesFilter && isAuthenticated && user) {
            // Use user's resources endpoint when "My Resources" is selected
            url = `${base.replace(/\/$/, '')}/api/user/resources`;
          } else {
            // Use regular nearby resources endpoint
            url = `${base.replace(/\/$/, '')}/api/resources?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${searchRadius}`;

            // Add filter parameters for nearby search
            if (availabilityFilter !== 'all') url += `&availability=${availabilityFilter}`;
            if (typeFilter !== 'all') url += `&resource_type=${typeFilter}`;
            if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;
          }

          const res = await axios.get(url, { headers: { Accept: 'application/json' } });
          if (res.data && res.data.success) {
            const items = res.data.data.map((it: any) => ({
              id: it.id,
              location: it.location || `${it.lat},${it.lng}`,
              address: it.address,
              contact: it.contact,
              contact_phone: it.contact_phone,
              resource_type: it.resource_type,
              details: it.details || '',
              capacity: it.capacity,
              availability: it.availability || 'available',
              distance_km: it.distance_km,
              timestamp: new Date(it.created_at || Date.now()),
              lat: parseFloat(it.lat),
              lng: parseFloat(it.lng),
              photos: it.photos ? (typeof it.photos === 'string' ? JSON.parse(it.photos) : it.photos) : undefined,
              videos: it.videos ? (typeof it.videos === 'string' ? JSON.parse(it.videos) : it.videos) : undefined,
              user_id: it.user_id,
              // Handle both nested user object (from getUserResources) and flattened fields (from index)
              reporter_name: it.user?.name || it.reporter_name,
              reporter_email: it.user?.email || it.reporter_email,
              reporter_phone: it.user?.phone || it.reporter_phone,
              comments: it.comments || []
            }));
            setResources(items);
          } else {
            setResources([]);
          }
        } catch (e) {
          console.error('Failed to load resources', e);
          setResources([]);
        } finally {
          setLoadingResources(false);
        }
      }, 500);

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [userCoords, searchRadius, availabilityFilter, typeFilter, searchTerm, myResourcesFilter, isAuthenticated, user]);

    const deleteResource = async (id: number) => {
      try {
        const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
        const url = `${base.replace(/\/$/, '')}/api/resources/${id}`;

        // Include authentication headers if user is authenticated
        const headers: any = { Accept: 'application/json' };
        if (isAuthenticated && user) {
          // The auth token should already be set in axios defaults from the auth context
        }

        await axios.delete(url, { headers });

        // Update local state
        setResources(resources.filter(r => r.id !== id));
        setToastMessage('Resource deleted successfully');
        setShowToast(true);
      } catch (error: any) {
        console.error('Failed to delete resource', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete resource';
        setToastMessage(errorMessage);
        setShowToast(true);
      }
    };

  const confirmAvailabilityUpdate = (resourceId: number, newAvailability: string) => {
    setPendingAvailabilityUpdate({ resourceId, newAvailability });
    setShowAvailabilityAlert(true);
  };

  const handleAvailabilityUpdateConfirm = async () => {
    if (!pendingAvailabilityUpdate) return;

    const { resourceId, newAvailability } = pendingAvailabilityUpdate;
    setShowAvailabilityAlert(false);
    setPendingAvailabilityUpdate(null);

    await updateResourceAvailability(resourceId, newAvailability);
  };

  const handleAvailabilityUpdateCancel = () => {
    setShowAvailabilityAlert(false);
    setPendingAvailabilityUpdate(null);
  };

  const updateResourceAvailability = async (id: number, newAvailability: string) => {
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/resources/${id}/availability`;

      // Include authentication headers if user is authenticated
      const headers: any = { Accept: 'application/json' };
      if (isAuthenticated && user) {
        // The auth token should already be set in axios defaults from the auth context
      }

      await axios.patch(url, { availability: newAvailability }, { headers });

      // Update local state
      setResources(resources.map(r =>
        r.id === id ? { ...r, availability: newAvailability } : r
      ));

      setToastMessage(`Availability updated to ${newAvailability}`);
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to update availability', error);
      const errorMessage = error.response?.data?.message || 'Failed to update availability';
      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };

  const openResourceModal = (resource: ReliefResource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
    fetchComments(resource.id);
  };

  const fetchComments = async (resourceId: number) => {
    setLoadingComments(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/resources/${resourceId}/comments`;

      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setComments(res.data.data);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error('Failed to load comments', e);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!selectedResource || !newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/resources/${selectedResource.id}/comments`;

      const res = await axios.post(url, { comment: newComment.trim() });
      if (res.data && res.data.success) {
        setComments(prev => [...prev, res.data.data]);
        setNewComment('');
        setToastMessage('Comment added successfully');
        setShowToast(true);
      }
    } catch (e: any) {
      console.error('Failed to submit comment', e);
      const errorMessage = e.response?.data?.message || 'Failed to add comment';
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setSubmittingComment(false);
    }
  };

  const isUserResource = (resource: ReliefResource) => {
    return isAuthenticated && user && resource.user_id === user.id;
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available': return 'success';
      case 'limited': return 'warning';
      case 'unavailable': return 'danger';
      default: return 'medium';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability?.toLowerCase()) {
      case 'available': return 'Available';
      case 'limited': return 'Limited';
      case 'unavailable': return 'Unavailable';
      default: return availability || 'Unknown';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available': return checkmarkDone;
      case 'limited': return warning;
      case 'unavailable': return trash;
      default: return checkmark;
    }
  };

  const getAvailabilityIconColor = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available': return '#10dc60'; // success color
      case 'limited': return '#ffce00'; // warning color
      case 'unavailable': return '#f04141'; // danger color
      default: return '#92949c'; // medium color
    }
  };

  const getResourceTypeIcon = (resourceType?: string) => {
    switch (resourceType?.toLowerCase()) {
      case 'food': return restaurant;
      case 'medical': return medkit;
      case 'shelter': return home;
      case 'water': return water;
      case 'supplies': return briefcase;
      default: return locationIcon;
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
  };    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Relief Resources</IonTitle>
            <IonButton slot="end" routerLink="/dashboard" fill="clear">
              <IonIcon icon={person} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
                    <div className="resources-header">
            <IonButton expand="block" routerLink="/tabs/resource/new" className="request-button">
              <IonIcon icon={add} slot="start" />
              Add Relief Resource
            </IonButton>
          </div>

          <div className="map-container">
            <div className="map-meta">
              <div>
                {accuracy !== null && <small>Accuracy: {Math.round(accuracy)} m</small>}
                {lastUpdated && <small>Updated: {lastUpdated.toLocaleTimeString()}</small>}
              </div>
              <div>
                <IonButton size="small" onClick={refreshLocation}>Refresh Location</IonButton>
                <IonButton
                  size="small"
                  onClick={async () => { await getCurrentLocation(); startWatching(); }}
                  style={{ marginLeft: 8 }}
                >
                  Get Current Location
                </IonButton>
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

            {/* Radius Control */}
            <div className="radius-control">
              <IonLabel>
                <small>Search Radius: {searchRadius} km</small>
              </IonLabel>
              <IonRange
                min={1}
                max={500}
                step={1}
                value={searchRadius}
                onIonChange={(e) => setSearchRadius(e.detail.value as number)}
                className="radius-slider"
              />
            </div>

            {/* Filter Controls */}
            <div className="filter-controls">
              <IonText color="primary">
                <h4>🔍 Filters & Search</h4>
              </IonText>

              {/* Search Field */}
              <div className="filter-row">
                <IonLabel>Search:</IonLabel>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search location, details, provider..."
                  className="search-input"
                  title="Search across all fields"
                />
              </div>

              <div className="filter-row">
                <IonLabel>Availability:</IonLabel>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="filter-select"
                  title="Filter by availability"
                >
                  <option value="all">All Availability</option>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="filter-row">
                <IonLabel>My Resources:</IonLabel>
                <input
                  type="checkbox"
                  checked={myResourcesFilter}
                  onChange={(e) => setMyResourcesFilter(e.target.checked)}
                  className="filter-checkbox"
                  title="Show only my resources"
                />
              </div>
              <div className="filter-row">
                <IonLabel>Sort by:</IonLabel>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                  title="Sort resources by"
                >
                  <option value="distance_km">Distance</option>
                  <option value="capacity">Capacity</option>
                  <option value="availability">Availability</option>
                  <option value="timestamp">Date</option>
                </select>
                <IonLabel>Order:</IonLabel>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="filter-select"
                  title="Sort order"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
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

          <div className="resources-list">
            <IonText color="primary">
              <h2>Relief Resources</h2>
            </IonText>

            {/* Current filter summary */}
            {(availabilityFilter !== 'all' || typeFilter !== 'all' || myResourcesFilter) && (
              <div className="filter-summary">
                <IonText color="medium">
                  <small>
                    <strong>Active Filters:</strong>
                    {myResourcesFilter && ' My Resources'}
                    {availabilityFilter !== 'all' && ` • Availability: ${getAvailabilityText(availabilityFilter)}`}
                    {typeFilter !== 'all' && ` • Type: ${typeFilter}`}
                  </small>
                </IonText>
              </div>
            )}

            {resources.length === 0 ? (
              <IonCard>
                <IonCardContent className="no-resources">
                  <IonIcon icon={warning} color="medium" />
                  <IonText color="medium">
                                        <p>No relief resources in your area</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            ) : (
              <IonList>
                {sortedResources.map((r) => (
                  <IonItemSliding key={r.id}>
                    <IonItem button onClick={() => openResourceModal(r)}>
                      <IonIcon icon={getResourceTypeIcon(r.resource_type)} slot="start" color={getResourceTypeColor(r.resource_type)} />
                      <IonLabel>
                        <h2>
                          {r.location}
                          <IonBadge color={getAvailabilityColor(r.availability)} style={{ fontSize: '0.8em', padding: '2px 6px' }}>
                            {getAvailabilityText(r.availability)}
                          </IonBadge>
                        </h2>
                        <p>
                          <span className={`availability-status ${r.availability.toLowerCase()}`}>
                            <IonIcon icon={getAvailabilityIcon(r.availability)} />
                            {getAvailabilityText(r.availability)}
                          </span>
                          {r.distance_km && <span> • {parseFloat(r.distance_km+""||"0").toFixed(1)} km away</span>}
                        </p>
                        {r.resource_type && (
                          <p>
                            <IonIcon icon={getResourceTypeIcon(r.resource_type)} style={{ marginRight: '4px' }} />
                            <strong>Type:</strong> {r.resource_type}
                          </p>
                        )}
                        {r.capacity && (
                          <p><strong>Capacity:</strong> {r.capacity} people</p>
                        )}
                        <p>{r.details}</p>
                        {r.address && <p><strong>Address:</strong> {r.address}</p>}
                        {r.contact && <p><strong>Contact:</strong> {r.contact}</p>}
                        {r.reporter_name && <p><strong>Provided by:</strong> {r.reporter_name}</p>}
                        {r.reporter_phone && <p><strong>Phone:</strong> {r.reporter_phone}</p>}
                        {(r.photos && r.photos.length > 0) && (
                          <p><strong>Photos:</strong> {r.photos.length} attached</p>
                        )}
                        {(r.videos && r.videos.length > 0) && (
                          <p><strong>Videos:</strong> {r.videos.length} attached</p>
                        )}
                        {r.comments && r.comments.length > 0 && (
                          <p><strong>Comments:</strong> {r.comments.length}</p>
                        )}
                        <small>{r.timestamp.toLocaleString()}</small>
                      </IonLabel>
                    </IonItem>
                    <IonItemOptions side="end">
                      {isUserResource(r) && (
                        <>
                          <IonItemOption color="success" onClick={() => confirmAvailabilityUpdate(r.id, 'available')}>
                            <IonIcon icon={checkmark} slot="icon-only" />
                          </IonItemOption>
                          <IonItemOption color="warning" onClick={() => confirmAvailabilityUpdate(r.id, 'limited')}>
                            <IonIcon icon={warning} slot="icon-only" />
                          </IonItemOption>
                          <IonItemOption color="danger" onClick={() => confirmAvailabilityUpdate(r.id, 'unavailable')}>
                            <IonIcon icon={trash} slot="icon-only" />
                          </IonItemOption>
                        </>
                      )}
                      {!isUserResource(r) && (
                        <IonItemOption color="medium" disabled>
                          <IonIcon icon={person} slot="icon-only" />
                        </IonItemOption>
                      )}
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            )}
          </div>

          <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} />

          <IonAlert
            isOpen={showAvailabilityAlert}
            onDidDismiss={handleAvailabilityUpdateCancel}
            header={'Confirm Availability Update'}
            message={`Are you sure you want to change the availability to "${getAvailabilityText(pendingAvailabilityUpdate?.newAvailability || '')}"?`}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                handler: handleAvailabilityUpdateCancel,
              },
              {
                text: 'Confirm',
                role: 'confirm',
                handler: handleAvailabilityUpdateConfirm,
              },
            ]}
          />
        </IonContent>

        {/* Resource Details Modal */}
        <IonModal isOpen={showResourceModal} onDidDismiss={() => setShowResourceModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Resource Details</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowResourceModal(false)}>
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedResource && (
              <div className="request-modal-content">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="request-modal-header">
                      <IonIcon icon={getResourceTypeIcon(selectedResource.resource_type)} color={getResourceTypeColor(selectedResource.resource_type)} style={{ marginRight: '8px' }} />
                      {selectedResource.location}
                      <IonBadge color={getAvailabilityColor(selectedResource.availability)} style={{ marginLeft: '12px', fontSize: '0.9em', padding: '4px 8px' }}>
                        <IonIcon icon={getAvailabilityIcon(selectedResource.availability)} style={{ marginRight: '4px' }} />
                        {getAvailabilityText(selectedResource.availability)}
                      </IonBadge>
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="request-modal-chips">
                      <IonChip color={getAvailabilityColor(selectedResource.availability)} style={{ marginRight: '8px' }}>
                        <IonIcon icon={getAvailabilityIcon(selectedResource.availability)} />
                        {getAvailabilityText(selectedResource.availability)}
                      </IonChip>
                    </div>

                    <IonButton
                      fill="outline"
                      color="secondary"
                      onClick={() => window.open(`https://www.google.com/maps/dir//${selectedResource.lat},${selectedResource.lng}`, '_blank')}
                    >
                      <IonIcon icon={map} slot="start" />
                      Get Directions
                    </IonButton>

                    {selectedResource.resource_type && (
                      <p>
                        <IonIcon icon={getResourceTypeIcon(selectedResource.resource_type)} style={{ marginRight: '4px' }} />
                        <strong>Type:</strong> {selectedResource.resource_type}
                      </p>
                    )}

                    {selectedResource.capacity && (
                      <p><strong>Capacity:</strong> {selectedResource.capacity} people</p>
                    )}

                    <p><strong>Details:</strong> {selectedResource.details}</p>

                    {selectedResource.address && (
                      <p><strong>Address:</strong> {selectedResource.address}</p>
                    )}

                    {selectedResource.contact && (
                      <p><strong>Contact:</strong> {selectedResource.contact}</p>
                    )}

                    {selectedResource.contact_phone && (
                      <p><strong>Phone:</strong> {selectedResource.contact_phone}</p>
                    )}

                    {selectedResource.reporter_name && (
                      <p><strong>Provided by:</strong> {selectedResource.reporter_name}</p>
                    )}

                    {selectedResource.reporter_phone && (
                      <p><strong>Phone:</strong> {selectedResource.reporter_phone}</p>
                    )}

                    {selectedResource.distance_km && (
                      <p><strong>Distance:</strong> {parseFloat(selectedResource.distance_km+""||"0").toFixed(1)} km away</p>
                    )}

            <p><strong>Coordinates:</strong> <IonIcon icon={map} style={{ marginRight: '4px', fontSize: '16px' }} /><a href={`https://www.google.com/maps?q=${selectedResource.lat},${selectedResource.lng}`} target="_blank" rel="noopener noreferrer">{selectedResource.lat.toFixed(6)}, {selectedResource.lng.toFixed(6)}</a></p>

                    <p><strong>Submitted:</strong> {selectedResource.timestamp.toLocaleString()}</p>

                    {/* Photos Section */}
                    {selectedResource.photos && selectedResource.photos.length > 0 && (
                      <div className="request-modal-photos">
                        <h3>📸 Photos ({selectedResource.photos.length})</h3>
                        <div className="photos-grid">
                          {selectedResource.photos.map((photo, index) => (
                            <div key={index} className="photo-item">
                              <IonImg
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                onClick={() => window.open(photo, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos Section */}
                    {selectedResource.videos && selectedResource.videos.length > 0 && (
                      <div className="request-modal-videos">
                        <h3>🎥 Videos ({selectedResource.videos.length})</h3>
                        <div className="videos-container">
                          {selectedResource.videos.map((video, index) => (
                            <div key={index} className="video-item">
                              <video
                                controls
                                src={video}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="request-modal-comments">
                      <h3>💬 Comments ({comments.length})</h3>

                      {loadingComments ? (
                        <p>Loading comments...</p>
                      ) : comments.length === 0 ? (
                        <p>No comments yet. Be the first to comment!</p>
                      ) : (
                        <div className="comments-list">
                          {comments.map((comment) => (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-header">
                                <strong>{comment.user.name}</strong>
                                <small>{new Date(comment.created_at).toLocaleString()}</small>
                              </div>
                              <p>{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {isAuthenticated && (
                        <div className="add-comment-section">
                          <IonLabel>
                            <h4>Add a Comment</h4>
                          </IonLabel>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write your comment here..."
                            rows={3}
                            className="comment-textarea"
                          />
                          <IonButton
                            expand="block"
                            onClick={submitComment}
                            disabled={!newComment.trim() || submittingComment}
                          >
                            {submittingComment ? 'Posting...' : 'Post Comment'}
                          </IonButton>
                        </div>
                      )}

                      {!isAuthenticated && (
                        <div className="login-prompt">
                          <IonText color="medium">
                            <p>Please log in to add comments</p>
                          </IonText>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isUserResource(selectedResource) && (
                      <div className="request-modal-actions">
                        <IonButton
                          color="success"
                          onClick={() => {
                            confirmAvailabilityUpdate(selectedResource.id, 'available');
                            setShowResourceModal(false);
                          }}
                        >
                          <IonIcon icon={checkmark} slot="start" />
                          Mark Available
                        </IonButton>
                        <IonButton
                          color="warning"
                          onClick={() => {
                            confirmAvailabilityUpdate(selectedResource.id, 'limited');
                            setShowResourceModal(false);
                          }}
                        >
                          <IonIcon icon={warning} slot="start" />
                          Mark Limited
                        </IonButton>
                        <IonButton
                          color="danger"
                          onClick={() => {
                            confirmAvailabilityUpdate(selectedResource.id, 'unavailable');
                            setShowResourceModal(false);
                          }}
                        >
                          <IonIcon icon={trash} slot="start" />
                          Mark Unavailable
                        </IonButton>
                      </div>
                    )}
                    {!isUserResource(selectedResource) && (
                      <div className="request-modal-actions">
                        <IonText color="medium">
                          <p>You can only update your own resources</p>
                        </IonText>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonPage>
    );
  };

  export default ReliefResources;

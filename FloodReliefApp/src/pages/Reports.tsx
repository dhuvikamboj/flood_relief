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

interface ReliefRequest {
  id: number;
  location: string;
  address?: string;
  contact?: string;
  priority: string;
  request_type?: string;
  details: string;
  distance_km?: number;
  timestamp: Date;
  lat: number;
  lng: number;
  photos?: string[];
  videos?: string[];
  status?: string;
  user_id?: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  comments?: Comment[];
}

  const Reports: React.FC = () => {
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ requestId: number; newStatus: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');    // Use the location hook
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

  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(() => {
    const saved = localStorage.getItem('preferred_search_radius');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [myRequestsFilter, setMyRequestsFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('distance_km');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'distance_km':
          aVal = a.distance_km || 0;
          bVal = b.distance_km || 0;
          break;
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'timestamp':
          aVal = a.timestamp.getTime();
          bVal = b.timestamp.getTime();
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
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
  }, [requests, sortBy, sortOrder]);
  const [currentLayer, setCurrentLayer] = useState<string>(() => {
    const saved = localStorage.getItem('preferred_map_layer');
    return saved || 'satellite';
  });
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
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

  useEffect(() => {
    (window as any).openRequestModal = openRequestModal;
  }, []);

    // fetch nearby requests when coords available
    useEffect(() => {
      if (!userCoords) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        setLoadingRequests(true);
        try {
          const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';

          let url: string;
          if (myRequestsFilter && isAuthenticated && user) {
            // Use user's requests endpoint when "My Reports" is selected
            url = `${base.replace(/\/$/, '')}/api/user/requests`;
          } else {
            // Use regular nearby requests endpoint
            url = `${base.replace(/\/$/, '')}/api/requests?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${searchRadius}`;

            // Add filter parameters for nearby search
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;
            if (typeFilter !== 'all') url += `&request_type=${typeFilter}`;
            if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;
          }

          const res = await axios.get(url, { headers: { Accept: 'application/json' } });
          if (res.data && res.data.success) {
            const items = res.data.data.map((it: any) => ({
              id: it.id,
              location: it.location || `${it.lat},${it.lng}`,
              address: it.address,
              contact: it.contact,
              priority: it.priority || 'Low',
              request_type: it.request_type,
              details: it.details || '',
              distance_km: it.distance_km,
              timestamp: new Date(it.created_at || Date.now()),
              lat: parseFloat(it.lat),
              lng: parseFloat(it.lng),
              photos: it.photos ? JSON.parse(it.photos) : undefined,
              videos: it.videos ? JSON.parse(it.videos) : undefined,
              status: it.status || 'pending',
              user_id: it.user_id,
              reporter_name: it.reporter_name,
              reporter_email: it.reporter_email,
              reporter_phone: it.reporter_phone,
              comments: it.comments || []
            }));
            setRequests(items);
          } else {
            setRequests([]);
          }
        } catch (e) {
          console.error('Failed to load requests', e);
          setRequests([]);
        } finally {
          setLoadingRequests(false);
        }
      }, 500);

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [userCoords, searchRadius, statusFilter, priorityFilter, typeFilter, searchTerm, myRequestsFilter]);

    const deleteRequest = async (id: number) => {
      try {
        const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
        const url = `${base.replace(/\/$/, '')}/api/requests/${id}`;

        // Include authentication headers if user is authenticated
        const headers: any = { Accept: 'application/json' };
        if (isAuthenticated && user) {
          // The auth token should already be set in axios defaults from the auth context
        }

        await axios.delete(url, { headers });

        // Update local state
        setRequests(requests.filter(r => r.id !== id));
        setToastMessage('Request deleted successfully');
        setShowToast(true);
      } catch (error: any) {
        console.error('Failed to delete request', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete request';
        setToastMessage(errorMessage);
        setShowToast(true);
      }
    };

  const confirmStatusUpdate = (requestId: number, newStatus: string) => {
    setPendingStatusUpdate({ requestId, newStatus });
    setShowStatusAlert(true);
  };

  const handleStatusUpdateConfirm = async () => {
    if (!pendingStatusUpdate) return;

    const { requestId, newStatus } = pendingStatusUpdate;
    setShowStatusAlert(false);
    setPendingStatusUpdate(null);

    await updateRequestStatus(requestId, newStatus);
  };

  const handleStatusUpdateCancel = () => {
    setShowStatusAlert(false);
    setPendingStatusUpdate(null);
  };

  const updateRequestStatus = async (id: number, newStatus: string) => {
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/requests/${id}/status`;

      // Include authentication headers if user is authenticated
      const headers: any = { Accept: 'application/json' };
      if (isAuthenticated && user) {
        // The auth token should already be set in axios defaults from the auth context
      }

      await axios.patch(url, { status: newStatus }, { headers });

      // Update local state
      setRequests(requests.map(r =>
        r.id === id ? { ...r, status: newStatus } : r
      ));

      setToastMessage(`Status updated to ${newStatus}`);
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to update status', error);
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };

  const openRequestModal = (request: ReliefRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
    fetchComments(request.id);
  };

  const fetchComments = async (requestId: number) => {
    setLoadingComments(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/requests/${requestId}/comments`;

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
    if (!selectedRequest || !newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/requests/${selectedRequest.id}/comments`;

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

  const isUserRequest = (request: ReliefRequest) => {
    return isAuthenticated && user && request.user_id == user.id;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  };

  const getPriorityIcon = (priority: string) => {
    const color = getPriorityColor(priority);
    let iconColor = '#3880ff'; // default blue

    switch (color) {
      case 'danger': iconColor = '#eb445a'; break; // red
      case 'warning': iconColor = '#ffc409'; break; // yellow
      case 'success': iconColor = '#2dd36f'; break; // green
    }

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" fill="${iconColor}" stroke="#fff" stroke-width="2"/>
          <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
        </svg>
      `)}`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [41, 41]
    });
  };

  const getRequestTypeIcon = (requestType?: string) => {
    switch (requestType?.toLowerCase()) {
      case 'medical': return medkit;
      case 'food': return restaurant;
      case 'shelter': return home;
      case 'water': return water;
      case 'supplies': return briefcase;
      default: return locationIcon;
    }
  };

  const getRequestTypeColor = (requestType?: string) => {
    switch (requestType?.toLowerCase()) {
      case 'medical': return 'danger';
      case 'food': return 'warning';
      case 'shelter': return 'primary';
      case 'water': return 'tertiary';
      case 'supplies': return 'secondary';
      default: return 'medium';
    }
  };

  const getRequestTypeMapIcon = (requestType?: string) => {
    const color = getRequestTypeColor(requestType);
    let iconColor = '#3880ff'; // default blue
    let iconSvg = '';

    switch (requestType?.toLowerCase()) {
      case 'medical':
        iconColor = '#eb445a'; // red
        iconSvg = `<path d="M8 6h2v4h4v2h-4v4h-2v-4h-4v-2h4z"/>`;
        break;
      case 'food':
        iconColor = '#ffc409'; // yellow
        iconSvg = `<path d="M7 4h2v2h2v2h-2v6h-2v-6h-2v-2h2z"/><path d="M9 14h2v2h-2z"/>`;
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
            <IonTitle>Relief Requests</IonTitle>
            <IonButton slot="end" routerLink="/dashboard" fill="clear">
              <IonIcon icon={person} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="requests-header">
            <IonButton expand="block" routerLink="/tabs/request/new" className="request-button">
              <IonIcon icon={add} slot="start" />
              Submit Relief Request
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
                  placeholder="Search location, details, reporter..."
                  className="search-input"
                  title="Search across all fields"
                />
              </div>

              <div className="filter-row">
                <IonLabel>Status:</IonLabel>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                  title="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="filter-row">
                <IonLabel>Priority:</IonLabel>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="filter-select"
                  title="Filter by priority"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="filter-row">
                <IonLabel>My Reports:</IonLabel>
                <input
                  type="checkbox"
                  checked={myRequestsFilter}
                  onChange={(e) => setMyRequestsFilter(e.target.checked)}
                  className="filter-checkbox"
                  title="Show only my reports"
                />
              </div>
              <div className="filter-row">
                <IonLabel>Sort by:</IonLabel>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                  title="Sort requests by"
                >
                  <option value="distance_km">Distance</option>
                  <option value="priority">Priority</option>
                  <option value="timestamp">Date</option>
                  <option value="status">Status</option>
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

          <div className="requests-list">
            <IonText color="primary">
              <h2>Relief Requests</h2>
            </IonText>

            {/* Current filter summary */}
            {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || myRequestsFilter || searchTerm.trim()) && (
              <div className="filter-summary">
                <IonText color="medium">
                  <small>
                    <strong>Active Filters:</strong>
                    {myRequestsFilter && ' My Reports'}
                    {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
                    {priorityFilter !== 'all' && ` • Priority: ${priorityFilter}`}
                    {typeFilter !== 'all' && ` • Type: ${typeFilter}`}
                    {searchTerm.trim() && ` • Search: "${searchTerm.trim()}"`}
                  </small>
                </IonText>
              </div>
            )}

            {requests.length === 0 ? (
              <IonCard>
                <IonCardContent className="no-requests">
                  <IonIcon icon={warning} color="medium" />
                  <IonText color="medium">
                    <p>No relief requests in your area</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            ) : (
              <IonList>
                {sortedRequests.map((r) => (
                  <IonItemSliding key={r.id}>
                    <IonItem button onClick={() => openRequestModal(r)}>
                      <IonIcon icon={getRequestTypeIcon(r.request_type)} slot="start" color={getRequestTypeColor(r.request_type)} />
                      <IonLabel>
                        <h2>{r.location}</h2>
                        <p>
                          <strong>Priority:</strong> {r.priority}
                          {r.distance_km && <span> • {parseFloat(r.distance_km+""||"0").toFixed(1)} km away</span>}
                          <IonBadge color={getStatusColor(r.status || 'pending')} style={{ marginLeft: '8px' }}>
                            {getStatusText(r.status || 'pending')}
                          </IonBadge>
                        </p>
                        {r.request_type && (
                          <p>
                            <IonIcon icon={getRequestTypeIcon(r.request_type)} style={{ marginRight: '4px' }} />
                            <strong>Type:</strong> {r.request_type}
                          </p>
                        )}
                        <p>{r.details}</p>
                        {r.address && <p><strong>Address:</strong> {r.address}</p>}
                        {r.contact && <p><strong>Contact:</strong> {r.contact}</p>}
                        {r.reporter_name && <p><strong>Reported by:</strong> {r.reporter_name}</p>}
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
                      {isUserRequest(r) && (
                        <>
                          <IonItemOption color="primary" onClick={() => confirmStatusUpdate(r.id, 'in-progress')}>
                            <IonIcon icon={checkmark} slot="icon-only" />
                          </IonItemOption>
                          <IonItemOption color="success" onClick={() => confirmStatusUpdate(r.id, 'completed')}>
                            <IonIcon icon={checkmarkDone} slot="icon-only" />
                          </IonItemOption>
                          <IonItemOption color="danger" onClick={() => deleteRequest(r.id)}>
                            <IonIcon icon={trash} slot="icon-only" />
                          </IonItemOption>
                        </>
                      )}
                      {!isUserRequest(r) && (
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
            isOpen={showStatusAlert}
            onDidDismiss={handleStatusUpdateCancel}
            header={'Confirm Status Update'}
            message={`Are you sure you want to change the status to "${pendingStatusUpdate?.newStatus}"?`}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                handler: handleStatusUpdateCancel,
              },
              {
                text: 'Confirm',
                role: 'confirm',
                handler: handleStatusUpdateConfirm,
              },
            ]}
          />
        </IonContent>

        {/* Request Details Modal */}
        <IonModal isOpen={showRequestModal} onDidDismiss={() => setShowRequestModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowRequestModal(false)}>
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedRequest && (
              <div className="request-modal-content">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="request-modal-header">
                      <IonIcon icon={getRequestTypeIcon(selectedRequest.request_type)} color={getRequestTypeColor(selectedRequest.request_type)} style={{ marginRight: '8px' }} />
                      {selectedRequest.location}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="request-modal-chips">
                      <IonChip color={getPriorityColor(selectedRequest.priority)} style={{ marginRight: '8px' }}>
                        {selectedRequest.priority} Priority
                      </IonChip>
                      <IonChip color={getStatusColor(selectedRequest.status || 'pending')}>
                        {getStatusText(selectedRequest.status || 'pending')}
                      </IonChip>
                    </div>

                    <IonButton
                      fill="outline"
                      color="secondary"
                      onClick={() => window.open(`https://www.google.com/maps/dir//${selectedRequest.lat},${selectedRequest.lng}`, '_blank')}
                    >
                      <IonIcon icon={map} slot="start" />
                      Get Directions
                    </IonButton>

                    {selectedRequest.request_type && (
                      <p>
                        <IonIcon icon={getRequestTypeIcon(selectedRequest.request_type)} style={{ marginRight: '4px' }} />
                        <strong>Type:</strong> {selectedRequest.request_type}
                      </p>
                    )}

                    <p><strong>Details:</strong> {selectedRequest.details}</p>

                    {selectedRequest.address && (
                      <p><strong>Address:</strong> {selectedRequest.address}</p>
                    )}

                    {selectedRequest.contact && (
                      <p><strong>Contact:</strong> {selectedRequest.contact}</p>
                    )}

                    {selectedRequest.reporter_name && (
                      <p><strong>Reported by:</strong> {selectedRequest.reporter_name}</p>
                    )}

                    {selectedRequest.reporter_phone && (
                      <p><strong>Phone:</strong> {selectedRequest.reporter_phone}</p>
                    )}

                    {selectedRequest.distance_km && (
                      <p><strong>Distance:</strong> {parseFloat(selectedRequest.distance_km+""||"0").toFixed(1)} km away</p>
                    )}

            <p><strong>Coordinates:</strong> <IonIcon icon={map} style={{ marginRight: '4px', fontSize: '16px' }} /><a href={`https://www.google.com/maps?q=${selectedRequest.lat},${selectedRequest.lng}`} target="_blank" rel="noopener noreferrer">{selectedRequest.lat.toFixed(6)}, {selectedRequest.lng.toFixed(6)}</a></p>

                    <p><strong>Submitted:</strong> {selectedRequest.timestamp.toLocaleString()}</p>

                    {/* Photos Section */}
                    {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                      <div className="request-modal-photos">
                        <h3>📸 Photos ({selectedRequest.photos.length})</h3>
                        <div className="photos-grid">
                          {selectedRequest.photos.map((photo, index) => (
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
                    {selectedRequest.videos && selectedRequest.videos.length > 0 && (
                      <div className="request-modal-videos">
                        <h3>🎥 Videos ({selectedRequest.videos.length})</h3>
                        <div className="videos-container">
                          {selectedRequest.videos.map((video, index) => (
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
                    {isUserRequest(selectedRequest) && (
                      <div className="request-modal-actions">
                        <IonButton
                          color="primary"
                          onClick={() => {
                            confirmStatusUpdate(selectedRequest.id, 'in-progress');
                            setShowRequestModal(false);
                          }}
                        >
                          <IonIcon icon={checkmark} slot="start" />
                          Mark In Progress
                        </IonButton>
                        <IonButton
                          color="success"
                          onClick={() => {
                            confirmStatusUpdate(selectedRequest.id, 'completed');
                            setShowRequestModal(false);
                          }}
                        >
                          <IonIcon icon={checkmarkDone} slot="start" />
                          Mark Completed
                        </IonButton>
                        <IonButton
                          color="danger"
                          onClick={() => {
                            deleteRequest(selectedRequest.id);
                            setShowRequestModal(false);
                          }}
                        >
                          <IonIcon icon={trash} slot="start" />
                          Delete
                        </IonButton>
                      </div>
                    )}
                    {!isUserRequest(selectedRequest) && (
                      <div className="request-modal-actions">
                        <IonText color="medium">
                          <p>You can only update your own requests</p>
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

  export default Reports;

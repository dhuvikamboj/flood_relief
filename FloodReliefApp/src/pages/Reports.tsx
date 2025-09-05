import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonToast,
  IonText,
  IonList,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import { add, warning, person, map, list, locate } from 'ionicons/icons';
import axios from 'axios';
import api from '../../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Reports.css';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';
import { ReliefRequest, Comment } from '../components/RequestCard';
import RequestFilters, { RequestFilters as RequestFiltersType } from '../components/RequestFilters';
import RequestMap from '../components/RequestMap';
import RequestCard from '../components/RequestCard';
import RequestModal from '../components/RequestModal';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Reports: React.FC = () => {
  const [showToast, setToastMessage] = useState(false);
  const [toastMessage, setToastMessageContent] = useState('');
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ requestId: number; newStatus: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'data'>('map');
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Get user coordinates and auth (also expose controls to center on user)
  const { userCoords, getCurrentLocation, startWatching, refreshLocation } = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Filters state
  const [filters, setFilters] = useState<RequestFiltersType>({
    searchRadius: 5,
    statusFilter: 'all',
    priorityFilter: 'all',
    typeFilter: 'all',
    myRequestsFilter: false,
    searchTerm: '',
    sortBy: 'distance_km',
    sortOrder: 'asc',
  });

  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sorted requests based on filters
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (filters.sortBy) {
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
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [requests, filters.sortBy, filters.sortOrder]);

  // Set up global modal opener function
  useEffect(() => {
    (window as any).openRequestModal = openRequestModal;
  }, []);

  // Fetch nearby requests when coords or filters change
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
        if (filters.myRequestsFilter && isAuthenticated && user) {
          // Use user's requests endpoint when "My Reports" is selected
          url = `${base.replace(/\/$/, '')}/api/user/requests`;
        } else {
          // Use regular nearby requests endpoint
          url = `${base.replace(/\/$/, '')}/api/requests?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${filters.searchRadius}`;

          // Add filter parameters for nearby search
          if (filters.statusFilter !== 'all') url += `&status=${filters.statusFilter}`;
          if (filters.priorityFilter !== 'all') url += `&priority=${filters.priorityFilter}`;
          if (filters.typeFilter !== 'all') url += `&request_type=${filters.typeFilter}`;
          if (filters.searchTerm.trim()) url += `&search=${encodeURIComponent(filters.searchTerm.trim())}`;
        }

  const res = await api.get(url, { headers: { Accept: 'application/json' } });
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
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [userCoords, filters, isAuthenticated, user]);

  const updateFilters = (newFilters: Partial<RequestFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const isUserRequest = (request: ReliefRequest) => {
    return isAuthenticated && user && request.user_id == user.id;
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

      setToastMessageContent(`Status updated to ${newStatus}`);
      setToastMessage(true);
    } catch (error: any) {
      console.error('Failed to update status', error);
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      setToastMessageContent(errorMessage);
      setToastMessage(true);
    }
  };

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
      setToastMessageContent('Request deleted successfully');
      setToastMessage(true);
    } catch (error: any) {
      console.error('Failed to delete request', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete request';
      setToastMessageContent(errorMessage);
      setToastMessage(true);
    }
  };

  const openRequestModal = (request: ReliefRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
    fetchComments(request.id);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedRequest(null);
    setComments([]);
    setNewComment('');
  };

  const fetchComments = async (requestId: number) => {
    setLoadingComments(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/requests/${requestId}/comments`;

  const res = await api.get(url);
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
        setToastMessageContent('Comment added successfully');
        setToastMessage(true);
      }
    } catch (e: any) {
      console.error('Failed to submit comment', e);
      const errorMessage = e.response?.data?.message || 'Failed to add comment';
      setToastMessageContent(errorMessage);
      setToastMessage(true);
    } finally {
      setSubmittingComment(false);
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

  const renderMapView = () => (
    <div className="map-tab-content">
      <RequestMap requests={sortedRequests} />
    </div>
  );

  const renderDataView = () => (
    <div className="data-tab-content">
      <div className="requests-list">
        <IonText color="primary">
          <h2>Relief Requests</h2>
        </IonText>

        {/* Current filter summary */}
        {(filters.statusFilter !== 'all' || filters.priorityFilter !== 'all' || filters.typeFilter !== 'all' || filters.myRequestsFilter || filters.searchTerm.trim()) && (
          <div className="filter-summary">
            <IonText color="medium">
              <small>
                <strong>Active Filters:</strong>
                {filters.myRequestsFilter && ' My Reports'}
                {filters.statusFilter !== 'all' && ` • Status: ${filters.statusFilter}`}
                {filters.priorityFilter !== 'all' && ` • Priority: ${filters.priorityFilter}`}
                {filters.typeFilter !== 'all' && ` • Type: ${filters.typeFilter}`}
                {filters.searchTerm.trim() && ` • Search: "${filters.searchTerm.trim()}"`}
              </small>
            </IonText>
          </div>
        )}

        {loadingRequests ? (
          <div className="loading-state">
            <IonSpinner name="crescent" />
          </div>
        ) : requests.length === 0 ? (
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
            {sortedRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isUserRequest={isUserRequest(request)}
                onRequestClick={openRequestModal}
                onStatusUpdate={confirmStatusUpdate}
                onDeleteRequest={deleteRequest}
              />
            ))}
          </IonList>
        )}
      </div>
    </div>
  );  return (
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

        {/* Tab Content */}
        {activeTab === 'map' && renderMapView()}
        {activeTab === 'data' && renderDataView()}

        {/* Floating Filters FAB - Available in both views */}
        <RequestFilters
          filters={filters}
          onFiltersChange={updateFilters}
        />

        {/* Floating Current Location button (use IonFab) */}
        <IonFab slot="fixed" vertical="bottom" horizontal="start" className="location-fab location-fab-fixed">
          <IonFabButton
            className="location-fab-button"
            onClick={async () => { try { await startWatching(); } catch {} }}
            title="Center on my location"
          >
            <IonIcon icon={locate} />
          </IonFabButton>
        </IonFab>

        {/* Floating Tab Segment */}
        <div className="floating-tab-segment">
          <IonSegment 
            value={activeTab} 
            onIonChange={e => setActiveTab(e.detail.value as 'map' | 'data')}
          >
            <IonSegmentButton value="map">
              <IonIcon icon={map} />
              <IonLabel>Map</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="data">
              <IonIcon icon={list} />
              <IonLabel>List</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Toast for messages */}
        <IonToast 
          isOpen={showToast} 
          onDidDismiss={() => setToastMessage(false)} 
          message={toastMessage} 
          duration={2000} 
        />

        {/* Status Update Confirmation Alert */}
        <IonAlert
          isOpen={showStatusAlert}
          onDidDismiss={handleStatusUpdateCancel}
          header={'Confirm Status Update'}
          message={`Are you sure you want to change the status to "${getStatusText(pendingStatusUpdate?.newStatus || '')}"?`}
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
      <RequestModal
        isOpen={showRequestModal}
        request={selectedRequest}
        comments={comments}
        loadingComments={loadingComments}
        newComment={newComment}
        onNewCommentChange={setNewComment}
        onSubmitComment={submitComment}
        submittingComment={submittingComment}
        isUserRequest={selectedRequest ? isUserRequest(selectedRequest) : false}
        onClose={closeRequestModal}
        onStatusUpdate={confirmStatusUpdate}
        onDeleteRequest={deleteRequest}
        isAuthenticated={isAuthenticated}
      />
    </IonPage>
  );
};

export default Reports;

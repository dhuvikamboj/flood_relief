import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getApiBaseUrl } from '../config/api';
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
import './Reports.css';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../hooks/useLocation';
import { useExploreLocation } from '../hooks/useExploreLocation';
import { useAuth } from '../contexts/AuthContext';
import { ReliefRequest, Comment } from '../components/RequestCard';
import RequestFilters, { RequestFilters as RequestFiltersType } from '../components/RequestFilters';
import RequestMap from '../components/RequestMap';
import RequestCard from '../components/RequestCard';
import RequestModal from '../components/RequestModal';
import ReactGA4 from 'react-ga4';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [showToast, setToastMessage] = useState(false);
  const [toastMessage, setToastMessageContent] = useState('');
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ requestId: number; newStatus: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'data'>('map');
  const [isPageReady, setIsPageReady] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(!document.hidden);
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Get user coordinates and auth (also expose controls to center on user)
  const { userCoords, getCurrentLocation, startWatching, refreshLocation } = useLocation();
  const { exploreCoords, getActiveCoords } = useExploreLocation();
  const { user, isAuthenticated } = useAuth();

  // Get the active coordinates (exploration coords if exploring, otherwise user coords)
  const activeCoords = getActiveCoords(userCoords);

  // Ensure page is ready before map initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Page visibility detection for navigation handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (visible) {
        // Page became visible - likely returned from navigation
        // Reset page ready state to trigger map refresh
        setIsPageReady(false);
        setTimeout(() => {
          setIsPageReady(true);
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
  const [showExpired, setShowExpired] = useState<boolean>(false);

  // Track page view on component mount
  useEffect(() => {
    ReactGA4.event('page_view', {
      page_title: 'Reports',
      page_location: window.location.href,
      content_type: 'relief_requests'
    });
  }, []);

  // Track tab switches
  useEffect(() => {
    ReactGA4.event('view_change', {
      view_type: activeTab,
      content_type: 'relief_requests'
    });
  }, [activeTab]);

  // Track filter changes
  useEffect(() => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'searchRadius') return value !== 5;
      if (key === 'myRequestsFilter') return value === true;
      if (key === 'searchTerm') return value.trim() !== '';
      return value !== 'all';
    });

    if (activeFilters.length > 0) {
      ReactGA4.event('filter_applied', {
        filter_count: activeFilters.length,
        filters: activeFilters.map(([key, value]) => `${key}:${value}`).join(','),
        content_type: 'relief_requests'
      });
    }
  }, [filters]);

  // Track data loading
  useEffect(() => {
    if (requests.length > 0) {
      ReactGA4.event('data_loaded', {
        item_count: requests.length,
        content_type: 'relief_requests',
        has_user_location: !!userCoords
      });
    }
  }, [requests.length, userCoords]);

  // Sorted requests based on filters
  const sortedRequests = useMemo(() => {
    const active = showExpired ? requests : requests.filter(r => !r.expire_at || new Date(r.expire_at) > new Date());
    return [...active].sort((a, b) => {
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
    if (!activeCoords) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingRequests(true);
      try {
        const base = getApiBaseUrl();

        let url: string;
        if (filters.myRequestsFilter && isAuthenticated && user) {
          // Use user's requests endpoint when "My Reports" is selected
          url = `${base.replace(/\/$/, '')}/api/user/requests`;
        } else {
          // Use regular nearby requests endpoint with active coordinates
          url = `${base.replace(/\/$/, '')}/api/requests?lat=${activeCoords.lat}&lng=${activeCoords.lng}&radius_km=${filters.searchRadius}`;

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
          ,
            expire_at: it.expire_at || null,
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
  }, [activeCoords, filters, isAuthenticated, user]);

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
      const base = getApiBaseUrl();
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

      // Track status update
      ReactGA4.event('status_update', {
        content_type: 'relief_request',
        item_id: id,
        old_status: requests.find(r => r.id === id)?.status,
        new_status: newStatus
      });

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
      const base = getApiBaseUrl();
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

    // Track individual request access
    ReactGA4.event('item_view', {
      content_type: 'relief_request',
      item_id: request.id,
      priority: request.priority,
      request_type: request.request_type,
      status: request.status
    });
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
      const base = getApiBaseUrl();
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
      const base = getApiBaseUrl();
      const url = `${base.replace(/\/$/, '')}/api/requests/${selectedRequest.id}/comments`;

      const res = await axios.post(url, { comment: newComment.trim() });
      if (res.data && res.data.success) {
        setComments(prev => [...prev, res.data.data]);
        setNewComment('');

        // Track comment submission
        ReactGA4.event('comment_added', {
          content_type: 'relief_request',
          item_id: selectedRequest.id,
          comment_length: newComment.trim().length
        });

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
    return t(`requestFilters.status.${status}`) || status || 'Unknown';
  };

  // Handler for exploration location changes from the map
  const handleExploreLocationChange = (coords: { lat: number; lng: number } | null) => {
    // The exploration state is managed by the map component itself
    // This handler can be used for additional side effects if needed
    console.log('Reports: Exploration location changed to', coords);
  };

  const renderMapView = () => (
    <div className={`map-tab-content ${activeTab !== 'map' ? 'hidden' : ''}`}>
      <RequestMap 
        requests={sortedRequests} 
        isVisible={activeTab === 'map' && isPageReady && isPageVisible}
        onExploreLocationChange={handleExploreLocationChange}
      />
    </div>
  );

  const renderDataView = () => (
    <div className={`data-tab-content ${activeTab !== 'data' ? 'hidden' : ''}`}>
      <div className="requests-list">
        <IonText color="primary">
          <h2>{t('reports.title')}</h2>
        </IonText>

        {/* Current filter summary */}
        {(filters.statusFilter !== 'all' || filters.priorityFilter !== 'all' || filters.typeFilter !== 'all' || filters.myRequestsFilter || filters.searchTerm.trim()) && (
          <div className="filter-summary">
            <IonText color="medium">
                <small>
                <strong>{t('reports.activeFilters')}:</strong>
                {filters.myRequestsFilter && ` ${t('reports.myReports')}`}
                {filters.statusFilter !== 'all' && ` • ${t('common.status')}: ${t(`requestFilters.status.${filters.statusFilter}`) || filters.statusFilter}`}
                {filters.priorityFilter !== 'all' && ` • ${t('common.priority')}: ${t(`requestFilters.priority.${filters.priorityFilter}`) || filters.priorityFilter}`}
                {filters.typeFilter !== 'all' && ` • ${t('common.type')}: ${t(`requestFilters.type.${filters.typeFilter}`) || filters.typeFilter}`}
                {filters.searchTerm.trim() && ` • ${t('common.search')}: "${filters.searchTerm.trim()}"`}
              </small>
            </IonText>
          </div>
        )}

        {/* Expired toggle */}
  <div className="expired-toggle">
          <IonButton size="small" color={showExpired ? 'primary' : 'medium'} onClick={() => setShowExpired(prev => !prev)}>
            {showExpired ? t('reports.showingExpired') : t('reports.hideExpired')}
          </IonButton>
        </div>

        {loadingRequests ? (
          <div className="loading-state">
            <IonSpinner name="crescent" />
          </div>
        ) : requests.length === 0 ? (
              <IonCard>
            <IonCardContent className="no-requests">
              <IonIcon icon={warning} color="medium" />
              <IonText color="medium">
                <p>{t('reports.noRequests')}</p>
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
          <IonTitle>{t('reports.pageTitle')}</IonTitle>
          {/* dashboard header button removed per request */}
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="requests-header">
          <IonButton expand="block" routerLink="/tabs/request/new" className="request-button">
            <IonIcon icon={add} slot="start" />
            {t('reports.submitRequest')}
          </IonButton>
        </div>

        {/* Tab Content */}
        {renderMapView()}
        {renderDataView()}

        {/* Floating Filters FAB - Available in both views */}
        <RequestFilters
          filters={filters}
          onFiltersChange={updateFilters}
        />

        {/* Floating Current Location button (use IonFab) */}
        {/* <IonFab slot="fixed" vertical="bottom" horizontal="start" className="location-fab location-fab-fixed">
          <IonFabButton
            className="location-fab-button"
            onClick={async () => { try { await startWatching(); } catch {} }}
            title="Center on my location"
          >
            <IonIcon icon={locate} />
          </IonFabButton>
        </IonFab> */}

        {/* Floating Tab Segment */}
        <div className="floating-tab-segment">
          <IonSegment 
            value={activeTab} 
            onIonChange={e => setActiveTab(e.detail.value as 'map' | 'data')}
          >
            <IonSegmentButton value="map">
              <IonIcon icon={map} />
              <IonLabel>{t('common.map')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="data">
              <IonIcon icon={list} />
              <IonLabel>{t('common.list')}</IonLabel>
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
      header={t('reports.confirmStatusHeader')}
      message={t('reports.confirmStatusMessage', { status: getStatusText(pendingStatusUpdate?.newStatus || '') })}
          buttons={[
            {
        text: t('common.cancel'),
              role: 'cancel',
              handler: handleStatusUpdateCancel,
            },
            {
        text: t('common.confirm'),
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

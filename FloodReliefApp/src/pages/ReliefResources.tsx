import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonSelectOption,
  IonSelect,
  IonSearchbar,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
  IonText,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonAvatar,
  IonThumbnail,
  IonProgressBar,
  IonSpinner,
  IonToast,
  IonAlert,
} from '@ionic/react';
import { filter, list, map, search, addOutline, warning, add } from 'ionicons/icons';
import { ReliefResource } from '../types/resource';
import ResourceCard from '../components/ResourceCard';
import { useLocation } from '../hooks/useLocation';
import { getApiBaseUrl } from '../config/api';
import ResourceMap from '../components/ResourceMap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useResources } from '../hooks/useResources';
import { useComments } from '../hooks/useComments';
import { useExploreLocation } from '../hooks/useExploreLocation';
import ReactGA4 from 'react-ga4';
import FloatingFilters from '../components/FloatingFilters';
import ResourceModal from '../components/ResourceModal';

const ReliefResources: React.FC = () => {
  const { t } = useTranslation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAvailabilityAlert, setShowAvailabilityAlert] = useState(false);
  const [pendingAvailabilityUpdate, setPendingAvailabilityUpdate] = useState<{ resourceId: number; newAvailability: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'data'>('map');
  const [isPageReady, setIsPageReady] = useState(false);

  // Ensure page is ready before map initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Modal state
  const [selectedResource, setSelectedResource] = useState<ReliefResource | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Get user coordinates
  const { userCoords } = useLocation();

  // Exploration location hook
  const { getActiveCoords } = useExploreLocation();

  // Get user authentication
  const { user, isAuthenticated } = useAuth();

  // Get active coordinates (exploration or user location)
  const activeCoords = getActiveCoords(userCoords);

  // Use custom hooks with active coordinates
  const {
    sortedResources,
    loadingResources,
    filters,
    updateFilters,
    updateResourceAvailability,
    isUserResource,
  } = useResources(activeCoords);

  const {
    comments,
    loadingComments,
    newComment,
    setNewComment,
    submittingComment,
    fetchComments,
    submitComment,
    resetComments,
  } = useComments();

  // Track page view on component mount
  useEffect(() => {
    ReactGA4.event('page_view', {
      page_title: 'Resources',
      page_location: window.location.href,
      content_type: 'relief_resources'
    });
  }, []);

  // Track tab switches
  useEffect(() => {
    ReactGA4.event('view_change', {
      view_type: activeTab,
      content_type: 'relief_resources'
    });
  }, [activeTab]);

  // Track data loading
  useEffect(() => {
    if (sortedResources.length > 0) {
      ReactGA4.event('data_loaded', {
        item_count: sortedResources.length,
        content_type: 'relief_resources',
        has_user_location: !!userCoords
      });
    }
  }, [sortedResources.length, userCoords]);

  // Set up global modal opener function
  useEffect(() => {
    (window as any).openResourceModal = openResourceModal;
  }, []);

  const confirmAvailabilityUpdate = (resourceId: number, newAvailability: string) => {
    setPendingAvailabilityUpdate({ resourceId, newAvailability });
    setShowAvailabilityAlert(true);
  };

  const handleAvailabilityUpdateConfirm = async () => {
    if (!pendingAvailabilityUpdate) return;

    const { resourceId, newAvailability } = pendingAvailabilityUpdate;
    setShowAvailabilityAlert(false);
    setPendingAvailabilityUpdate(null);

    const result = await updateResourceAvailability(resourceId, newAvailability);

    // Track availability update
    ReactGA4.event('availability_update', {
      content_type: 'relief_resource',
      item_id: resourceId,
      new_availability: newAvailability
    });

    setToastMessage(result.message);
    setShowToast(true);
  };

  const handleAvailabilityUpdateCancel = () => {
    setShowAvailabilityAlert(false);
    setPendingAvailabilityUpdate(null);
  };

  const openResourceModal = (resource: ReliefResource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
    fetchComments(resource.id);

    // Track individual resource access
    ReactGA4.event('item_view', {
      content_type: 'relief_resource',
      item_id: resource.id,
      resource_type: resource.resource_type,
      availability: resource.availability
    });
  };

  const closeResourceModal = () => {
    setShowResourceModal(false);
    setSelectedResource(null);
    resetComments();
  };

  const handleSubmitComment = async () => {
    if (!selectedResource) return;
    
    const result = await submitComment(selectedResource.id);

    // Track comment submission
    ReactGA4.event('comment_added', {
      content_type: 'relief_resource',
      item_id: selectedResource.id,
      comment_length: newComment.trim().length
    });

    setToastMessage(result.message);
    setShowToast(true);
  };

  const handleExploreLocationChange = (coords: { lat: number; lng: number } | null) => {
    console.log('ReliefResources: Explore location changed to', coords);
    // The useResources hook will automatically update when activeCoords changes
    // Track exploration activity
    ReactGA4.event('map_exploration', {
      content_type: 'relief_resources',
      has_explore_location: !!coords,
      explore_lat: coords?.lat,
      explore_lng: coords?.lng
    });
  };

  const renderMapView = () => (
    <div className={`map-tab-content ${activeTab !== 'map' ? 'hidden' : ''}`}>
      {/* Map Component */}
      <ResourceMap 
        resources={sortedResources} 
        isVisible={activeTab === 'map' && isPageReady}
        onExploreLocationChange={handleExploreLocationChange}
      />
    </div>
  );

  const renderDataView = () => (
    <div className={`data-tab-content ${activeTab !== 'data' ? 'hidden' : ''}`}>
      <div className="resources-list">
        <IonText color="primary">
          <h2>{t('resources.title')}</h2>
        </IonText>

        {loadingResources ? (
          <div className="loading-state">
            <IonSpinner name="crescent" />
          </div>
        ) : sortedResources.length === 0 ? (
      <IonCard>
            <IonCardContent className="no-resources">
              <IonIcon icon={warning} color="medium" />
              <IonText color="medium">
        <p>{t('resources.noResources')}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {sortedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isUserResource={isUserResource(resource)}
                onResourceClick={openResourceModal}
                onAvailabilityUpdate={confirmAvailabilityUpdate}
              />
            ))}
          </IonList>
        )}
      </div>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('resources.pageTitle')}</IonTitle>
          {/* <IonButton slot="end" routerLink="/dashboard" fill="clear">
            <IonIcon icon={person} />
          </IonButton> */}
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="resources-header">
          <IonButton expand="block" routerLink="/tabs/resource/new" className="request-button">
            <IonIcon icon={add} slot="start" />
            {t('resources.addResource')}
          </IonButton>
        </div>

        {/* Tab Content */}
        {renderMapView()}
        {renderDataView()}

        {/* Floating Filters FAB - show only when on the resources page URL (uses pathname) */}
        {true && (
          <FloatingFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
        )}

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
          onDidDismiss={() => setShowToast(false)} 
          message={toastMessage} 
          duration={2000} 
        />

        {/* Availability Update Confirmation Alert */}
        <IonAlert
          isOpen={showAvailabilityAlert}
          onDidDismiss={handleAvailabilityUpdateCancel}
      header={t('resources.confirmAvailabilityHeader')}
      message={t('resources.confirmAvailabilityMessage', { availability: pendingAvailabilityUpdate?.newAvailability || '' })}
          buttons={[
            {
        text: t('common.cancel'),
              role: 'cancel',
              handler: handleAvailabilityUpdateCancel,
            },
            {
        text: t('common.confirm'),
              role: 'confirm',
              handler: handleAvailabilityUpdateConfirm,
            },
          ]}
        />
      </IonContent>

      {/* Resource Details Modal */}
     { <ResourceModal
        isOpen={showResourceModal}
        resource={selectedResource}
        comments={comments}
        loadingComments={loadingComments}
        newComment={newComment}
        onNewCommentChange={setNewComment}
        onSubmitComment={handleSubmitComment}
        submittingComment={submittingComment}
        isUserResource={selectedResource ? isUserResource(selectedResource) : false}
        onClose={closeResourceModal}
        onAvailabilityUpdate={confirmAvailabilityUpdate}
      />}
    </IonPage>
  );
  };

  export default ReliefResources;

import React, { useState, useEffect } from 'react';
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
  IonIcon,
  IonToast,
  IonText,
  IonList,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import { add, warning, person, map, list } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Reports.css';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';
import { useResources } from '../hooks/useResources';
import { useComments } from '../hooks/useComments';
import { ReliefResource } from '../types/resource';
import FloatingFilters from '../components/FloatingFilters';
import ResourceMap from '../components/ResourceMap';
import ResourceCard from '../components/ResourceCard';
import ResourceModal from '../components/ResourceModal';
import { getAvailabilityText } from '../utils/resourceUtils';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ReliefResources: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAvailabilityAlert, setShowAvailabilityAlert] = useState(false);
  const [pendingAvailabilityUpdate, setPendingAvailabilityUpdate] = useState<{ resourceId: number; newAvailability: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'data'>('map');
  
  // Modal state
  const [selectedResource, setSelectedResource] = useState<ReliefResource | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Get user coordinates
  const { userCoords } = useLocation();

  // Get user authentication
  const { user, isAuthenticated } = useAuth();

  // Use custom hooks
  const {
    sortedResources,
    loadingResources,
    filters,
    updateFilters,
    updateResourceAvailability,
    isUserResource,
  } = useResources(userCoords);

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
  };

  const closeResourceModal = () => {
    setShowResourceModal(false);
    setSelectedResource(null);
    resetComments();
  };

  const handleSubmitComment = async () => {
    if (!selectedResource) return;
    
    const result = await submitComment(selectedResource.id);
    setToastMessage(result.message);
    setShowToast(true);
  };

  const renderMapView = () => (
    <div className="map-tab-content">
      {/* Map Component */}
      <ResourceMap resources={sortedResources} />
    </div>
  );

  const renderDataView = () => (
    <div className="data-tab-content">
      <div className="resources-list">
        <IonText color="primary">
          <h2>Relief Resources</h2>
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
                <p>No relief resources in your area</p>
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

        {/* Tab Content */}
        {activeTab === 'map' && renderMapView()}
        {activeTab === 'data' && renderDataView()}

        {/* Floating Filters FAB - Available in both views */}
        <FloatingFilters
          filters={filters}
          onFiltersChange={updateFilters}
        />

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
          onDidDismiss={() => setShowToast(false)} 
          message={toastMessage} 
          duration={2000} 
        />

        {/* Availability Update Confirmation Alert */}
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
      <ResourceModal
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
      />
    </IonPage>
  );
  };

  export default ReliefResources;

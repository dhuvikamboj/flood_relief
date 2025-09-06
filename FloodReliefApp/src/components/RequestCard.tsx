import React from 'react';
import {
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { 
  medkit, 
  restaurant, 
  home, 
  water, 
  briefcase, 
  locationOutline,
  checkmark,
  checkmarkDone,
  trash,
  person
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

export interface Comment {
  id: number;
  comment: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ReliefRequest {
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

interface RequestCardProps {
  request: ReliefRequest;
  isUserRequest: boolean;
  onRequestClick: (request: ReliefRequest) => void;
  onStatusUpdate: (requestId: number, newStatus: string) => void;
  onDeleteRequest: (requestId: number) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  isUserRequest,
  onRequestClick,
  onStatusUpdate,
  onDeleteRequest,
}) => {
  const { t } = useTranslation();
  const getRequestTypeIcon = (requestType?: string) => {
    switch (requestType?.toLowerCase()) {
      case 'medical': return medkit;
      case 'food': return restaurant;
      case 'shelter': return home;
      case 'water': return water;
      case 'supplies': return briefcase;
      default: return locationOutline;
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
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
  case 'pending': return t('requestFilters.status.pending');
  case 'in-progress': return t('requestFilters.status.inProgress');
  case 'completed': return t('requestFilters.status.completed');
  case 'cancelled': return t('requestFilters.status.cancelled');
      default: return status || 'Unknown';
    }
  };

  return (
    <IonItemSliding>
      <IonItem button onClick={() => onRequestClick(request)}>
        <IonIcon 
          icon={getRequestTypeIcon(request.request_type)} 
          slot="start" 
          color={getRequestTypeColor(request.request_type)} 
        />
        <IonLabel>
          <h2>
            {request.location}
            <IonBadge color="medium" style={{ marginLeft: '8px', fontSize: '0.7em' }}>
              ID: {request.id}
            </IonBadge>
          </h2>
          <p>
            <strong>{t('requestFilters.priorityLabel')}:</strong> {request.priority}
            {request.distance_km && <span> • {parseFloat(request.distance_km+""||"0").toFixed(1)} {t('common.km')}</span>}
            <IonBadge color={getStatusColor(request.status || 'pending')} style={{ marginLeft: '8px' }}>
              {getStatusText(request.status || 'pending')}
            </IonBadge>
          </p>
          {request.request_type && (
            <p>
              <IonIcon icon={getRequestTypeIcon(request.request_type)} style={{ marginRight: '4px' }} />
              <strong>{t('requestFilters.typeLabel')}:</strong> {request.request_type}
            </p>
          )}
          <p>{request.details}</p>
          {request.address && <p><strong>{t('table.address')}:</strong> {request.address}</p>}
          {request.contact && <p><strong>{t('common.contact')}:</strong> {request.contact}</p>}
          {request.reporter_name && <p><strong>{t('requests.reportedBy')}:</strong> {request.reporter_name}</p>}
          {request.reporter_phone && <p><strong>{t('common.phone')}:</strong> {request.reporter_phone}</p>}
          {(request.photos && request.photos.length > 0) && (
            <p><strong>{t('requests.photos', { count: request.photos.length })}</strong></p>
          )}
          {(request.videos && request.videos.length > 0) && (
            <p><strong>{t('requests.videos', { count: request.videos.length })}</strong></p>
          )}
          {request.comments && request.comments.length > 0 && (
            <p><strong>{t('comments.title', { count: request.comments.length })}</strong></p>
          )}
          <small>{request.timestamp.toLocaleString()}</small>
        </IonLabel>
      </IonItem>
      <IonItemOptions side="end">
        {isUserRequest && (
          <>
            <IonItemOption color="primary" onClick={() => onStatusUpdate(request.id, 'in-progress')}>
              <IonIcon icon={checkmark} slot="icon-only" />
            </IonItemOption>
            <IonItemOption color="success" onClick={() => onStatusUpdate(request.id, 'completed')}>
              <IonIcon icon={checkmarkDone} slot="icon-only" />
            </IonItemOption>
            <IonItemOption color="danger" onClick={() => onDeleteRequest(request.id)}>
              <IonIcon icon={trash} slot="icon-only" />
            </IonItemOption>
          </>
        )}
        {!isUserRequest && (
          <IonItemOption color="medium" disabled>
            <IonIcon icon={person} slot="icon-only" />
          </IonItemOption>
        )}
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default RequestCard;

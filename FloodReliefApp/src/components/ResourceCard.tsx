import React from 'react';
import {
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { checkmark, warning, trash, person } from 'ionicons/icons';
import { ReliefResource } from '../types/resource';
import {
  getAvailabilityColor,
  getAvailabilityText,
  getAvailabilityIcon,
  getResourceTypeIcon,
  getResourceTypeColor,
} from '../utils/resourceUtils';

interface ResourceCardProps {
  resource: ReliefResource;
  isUserResource: boolean;
  onResourceClick: (resource: ReliefResource) => void;
  onAvailabilityUpdate: (resourceId: number, newAvailability: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isUserResource,
  onResourceClick,
  onAvailabilityUpdate,
}) => {
  return (
    <IonItemSliding>
      <IonItem button onClick={() => onResourceClick(resource)}>
        <IonIcon 
          icon={getResourceTypeIcon(resource.resource_type)} 
          slot="start" 
          color={getResourceTypeColor(resource.resource_type)} 
        />
        <IonLabel>
          <h2>
            {resource.location}
            <IonBadge color="medium" style={{ marginLeft: '8px', fontSize: '0.7em' }}>
              ID: {resource.id}
            </IonBadge>
            <IonBadge 
              color={getAvailabilityColor(resource.availability)} 
              style={{ fontSize: '0.8em', padding: '2px 6px', marginLeft: '4px' }}
            >
              {getAvailabilityText(resource.availability)}
            </IonBadge>
          </h2>
          <p>
            <span className={`availability-status ${resource.availability.toLowerCase()}`}>
              <IonIcon icon={getAvailabilityIcon(resource.availability)} />
              {getAvailabilityText(resource.availability)}
            </span>
            {resource.distance_km && (
              <span> • {parseFloat(resource.distance_km + "" || "0").toFixed(1)} km away</span>
            )}
          </p>
          {resource.resource_type && (
            <p>
              <IonIcon 
                icon={getResourceTypeIcon(resource.resource_type)} 
                style={{ marginRight: '4px' }} 
              />
              <strong>Type:</strong> {resource.resource_type}
            </p>
          )}
          {resource.capacity && (
            <p><strong>Capacity:</strong> {resource.capacity} people</p>
          )}
          <p>{resource.details}</p>
          {resource.address && <p><strong>Address:</strong> {resource.address}</p>}
          {resource.contact && <p><strong>Contact:</strong> {resource.contact}</p>}
          {resource.reporter_name && <p><strong>Provided by:</strong> {resource.reporter_name}</p>}
          {resource.reporter_phone && <p><strong>Phone:</strong> {resource.reporter_phone}</p>}
          {(resource.photos && resource.photos.length > 0) && (
            <p><strong>Photos:</strong> {resource.photos.length} attached</p>
          )}
          {(resource.videos && resource.videos.length > 0) && (
            <p><strong>Videos:</strong> {resource.videos.length} attached</p>
          )}
          {resource.comments && resource.comments.length > 0 && (
            <p><strong>Comments:</strong> {resource.comments.length}</p>
          )}
          <small>{resource.timestamp.toLocaleString()}</small>
          {resource.expire_at && (
            <p className="expire-at">
              <strong>Expires:</strong> {new Date(resource.expire_at).toLocaleString()}
            </p>
          )}
        </IonLabel>
      </IonItem>
      <IonItemOptions side="end">
        {isUserResource ? (
          <>
            <IonItemOption 
              color="success" 
              onClick={() => onAvailabilityUpdate(resource.id, 'available')}
            >
              <IonIcon icon={checkmark} slot="icon-only" />
            </IonItemOption>
            <IonItemOption 
              color="warning" 
              onClick={() => onAvailabilityUpdate(resource.id, 'limited')}
            >
              <IonIcon icon={warning} slot="icon-only" />
            </IonItemOption>
            <IonItemOption 
              color="danger" 
              onClick={() => onAvailabilityUpdate(resource.id, 'unavailable')}
            >
              <IonIcon icon={trash} slot="icon-only" />
            </IonItemOption>
          </>
        ) : (
          <IonItemOption color="medium" disabled>
            <IonIcon icon={person} slot="icon-only" />
          </IonItemOption>
        )}
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default ResourceCard;

import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonChip,
  IonImg,
  IonText,
} from '@ionic/react';
import { checkmark, warning, trash, map } from 'ionicons/icons';
import { ReliefResource, Comment } from '../types/resource';
import CommentSection from './CommentSection';
import {
  getAvailabilityColor,
  getAvailabilityText,
  getAvailabilityIcon,
  getResourceTypeIcon,
  getResourceTypeColor,
} from '../utils/resourceUtils';

interface ResourceModalProps {
  isOpen: boolean;
  resource: ReliefResource | null;
  comments: Comment[];
  loadingComments: boolean;
  newComment: string;
  onNewCommentChange: (comment: string) => void;
  onSubmitComment: () => void;
  submittingComment: boolean;
  isUserResource: boolean;
  onClose: () => void;
  onAvailabilityUpdate: (resourceId: number, newAvailability: string) => void;
}

const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  resource,
  comments,
  loadingComments,
  newComment,
  onNewCommentChange,
  onSubmitComment,
  submittingComment,
  isUserResource,
  onClose,
  onAvailabilityUpdate,
}) => {
  if (!resource) return null;

  const handleAvailabilityUpdate = (newAvailability: string) => {
    onAvailabilityUpdate(resource.id, newAvailability);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Resource Details</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            Close
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="request-modal-content">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="request-modal-header">
                <IonIcon 
                  icon={getResourceTypeIcon(resource.resource_type)} 
                  color={getResourceTypeColor(resource.resource_type)} 
                  style={{ marginRight: '8px' }} 
                />
                {resource.location}
                <IonBadge 
                  color={getAvailabilityColor(resource.availability)} 
                  style={{ marginLeft: '12px', fontSize: '0.9em', padding: '4px 8px' }}
                >
                  <IonIcon 
                    icon={getAvailabilityIcon(resource.availability)} 
                    style={{ marginRight: '4px' }} 
                  />
                  {getAvailabilityText(resource.availability)}
                </IonBadge>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="request-modal-chips">
                <IonChip 
                  color={getAvailabilityColor(resource.availability)} 
                  style={{ marginRight: '8px' }}
                >
                  <IonIcon icon={getAvailabilityIcon(resource.availability)} />
                  {getAvailabilityText(resource.availability)}
                </IonChip>
              </div>

              <IonButton
                fill="outline"
                color="secondary"
                onClick={() => window.open(`https://www.google.com/maps/dir//${resource.lat},${resource.lng}`, '_blank')}
              >
                <IonIcon icon={map} slot="start" />
                Get Directions
              </IonButton>

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

              <p><strong>Details:</strong> {resource.details}</p>

              {resource.address && (
                <p><strong>Address:</strong> {resource.address}</p>
              )}

              {resource.contact && (
                <p><strong>Contact:</strong> {resource.contact}</p>
              )}

              {resource.contact_phone && (
                <p><strong>Phone:</strong> {resource.contact_phone}</p>
              )}

              {resource.reporter_name && (
                <p><strong>Provided by:</strong> {resource.reporter_name}</p>
              )}

              {resource.reporter_phone && (
                <p><strong>Phone:</strong> {resource.reporter_phone}</p>
              )}

              {resource.distance_km && (
                <p><strong>Distance:</strong> {parseFloat(resource.distance_km + "" || "0").toFixed(1)} km away</p>
              )}

              <p>
                <strong>Coordinates:</strong> 
                <IonIcon icon={map} style={{ marginRight: '4px', fontSize: '16px' }} />
                <a 
                  href={`https://www.google.com/maps?q=${resource.lat},${resource.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {resource.lat.toFixed(6)}, {resource.lng.toFixed(6)}
                </a>
              </p>

              <p><strong>Submitted:</strong> {resource.timestamp.toLocaleString()}</p>

              {/* Photos Section */}
              {resource.photos && resource.photos.length > 0 && (
                <div className="request-modal-photos">
                  <h3>📸 Photos ({resource.photos.length})</h3>
                  <div className="photos-grid">
                    {resource.photos.map((photo, index) => (
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
              {resource.videos && resource.videos.length > 0 && (
                <div className="request-modal-videos">
                  <h3>🎥 Videos ({resource.videos.length})</h3>
                  <div className="videos-container">
                    {resource.videos.map((video, index) => (
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
              <CommentSection
                comments={comments}
                loadingComments={loadingComments}
                newComment={newComment}
                onNewCommentChange={onNewCommentChange}
                onSubmitComment={onSubmitComment}
                submittingComment={submittingComment}
              />

              {/* Action Buttons */}
              {isUserResource && (
                <div className="request-modal-actions">
                  <IonButton
                    color="success"
                    onClick={() => handleAvailabilityUpdate('available')}
                  >
                    <IonIcon icon={checkmark} slot="start" />
                    Mark Available
                  </IonButton>
                  <IonButton
                    color="warning"
                    onClick={() => handleAvailabilityUpdate('limited')}
                  >
                    <IonIcon icon={warning} slot="start" />
                    Mark Limited
                  </IonButton>
                  <IonButton
                    color="danger"
                    onClick={() => handleAvailabilityUpdate('unavailable')}
                  >
                    <IonIcon icon={trash} slot="start" />
                    Mark Unavailable
                  </IonButton>
                </div>
              )}
              {!isUserResource && (
                <div className="request-modal-actions">
                  <IonText color="medium">
                    <p>You can only update your own resources</p>
                  </IonText>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ResourceModal;

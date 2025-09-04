import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonChip,
  IonText,
  IonLabel,
  IonImg,
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
  map
} from 'ionicons/icons';
import { ReliefRequest, Comment } from './RequestCard';

interface RequestModalProps {
  isOpen: boolean;
  request: ReliefRequest | null;
  comments: Comment[];
  loadingComments: boolean;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onSubmitComment: () => void;
  submittingComment: boolean;
  isUserRequest: boolean;
  onClose: () => void;
  onStatusUpdate: (requestId: number, newStatus: string) => void;
  onDeleteRequest: (requestId: number) => void;
  isAuthenticated: boolean;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  request,
  comments,
  loadingComments,
  newComment,
  onNewCommentChange,
  onSubmitComment,
  submittingComment,
  isUserRequest,
  onClose,
  onStatusUpdate,
  onDeleteRequest,
  isAuthenticated,
}) => {
  if (!request) return null;

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
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Request Details</IonTitle>
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
                  icon={getRequestTypeIcon(request.request_type)} 
                  color={getRequestTypeColor(request.request_type)} 
                  style={{ marginRight: '8px' }} 
                />
                {request.location}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="request-modal-chips">
                <IonChip color={getPriorityColor(request.priority)} style={{ marginRight: '8px' }}>
                  {request.priority} Priority
                </IonChip>
                <IonChip color={getStatusColor(request.status || 'pending')}>
                  {getStatusText(request.status || 'pending')}
                </IonChip>
              </div>

              <IonButton
                fill="outline"
                color="secondary"
                onClick={() => window.open(`https://www.google.com/maps/dir//${request.lat},${request.lng}`, '_blank')}
              >
                <IonIcon icon={map} slot="start" />
                Get Directions
              </IonButton>

              {request.request_type && (
                <p>
                  <IonIcon icon={getRequestTypeIcon(request.request_type)} style={{ marginRight: '4px' }} />
                  <strong>Type:</strong> {request.request_type}
                </p>
              )}

              <p><strong>Details:</strong> {request.details}</p>

              {request.address && (
                <p><strong>Address:</strong> {request.address}</p>
              )}

              {request.contact && (
                <p><strong>Contact:</strong> {request.contact}</p>
              )}

              {request.reporter_name && (
                <p><strong>Reported by:</strong> {request.reporter_name}</p>
              )}

              {request.reporter_phone && (
                <p><strong>Phone:</strong> {request.reporter_phone}</p>
              )}

              {request.distance_km && (
                <p><strong>Distance:</strong> {parseFloat(request.distance_km+""||"0").toFixed(1)} km away</p>
              )}

              <p><strong>Coordinates:</strong> <IonIcon icon={map} style={{ marginRight: '4px', fontSize: '16px' }} /><a href={`https://www.google.com/maps?q=${request.lat},${request.lng}`} target="_blank" rel="noopener noreferrer">{request.lat.toFixed(6)}, {request.lng.toFixed(6)}</a></p>

              <p><strong>Submitted:</strong> {request.timestamp.toLocaleString()}</p>

              {/* Photos Section */}
              {request.photos && request.photos.length > 0 && (
                <div className="request-modal-photos">
                  <h3>📸 Photos ({request.photos.length})</h3>
                  <div className="photos-grid">
                    {request.photos.map((photo, index) => (
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
              {request.videos && request.videos.length > 0 && (
                <div className="request-modal-videos">
                  <h3>🎥 Videos ({request.videos.length})</h3>
                  <div className="videos-container">
                    {request.videos.map((video, index) => (
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
                      onChange={(e) => onNewCommentChange(e.target.value)}
                      placeholder="Write your comment here..."
                      rows={3}
                      className="comment-textarea"
                    />
                    <IonButton
                      expand="block"
                      onClick={onSubmitComment}
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
              {isUserRequest && (
                <div className="request-modal-actions">
                  <IonButton
                    color="primary"
                    onClick={() => {
                      onStatusUpdate(request.id, 'in-progress');
                      onClose();
                    }}
                  >
                    <IonIcon icon={checkmark} slot="start" />
                    Mark In Progress
                  </IonButton>
                  <IonButton
                    color="success"
                    onClick={() => {
                      onStatusUpdate(request.id, 'completed');
                      onClose();
                    }}
                  >
                    <IonIcon icon={checkmarkDone} slot="start" />
                    Mark Completed
                  </IonButton>
                  <IonButton
                    color="danger"
                    onClick={() => {
                      onDeleteRequest(request.id);
                      onClose();
                    }}
                  >
                    <IonIcon icon={trash} slot="start" />
                    Delete
                  </IonButton>
                </div>
              )}
              {!isUserRequest && (
                <div className="request-modal-actions">
                  <IonText color="medium">
                    <p>You can only update your own requests</p>
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

export default RequestModal;

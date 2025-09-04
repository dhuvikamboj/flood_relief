import React from 'react';
import {
  IonButton,
  IonLabel,
  IonText,
} from '@ionic/react';
import { Comment } from '../types/resource';
import { useAuth } from '../contexts/AuthContext';

interface CommentSectionProps {
  comments: Comment[];
  loadingComments: boolean;
  newComment: string;
  onNewCommentChange: (comment: string) => void;
  onSubmitComment: () => void;
  submittingComment: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  loadingComments,
  newComment,
  onNewCommentChange,
  onSubmitComment,
  submittingComment,
}) => {
  const { isAuthenticated } = useAuth();

  return (
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
  );
};

export default CommentSection;

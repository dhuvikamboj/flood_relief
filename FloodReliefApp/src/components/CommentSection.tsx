import React from 'react';
import {
  IonButton,
  IonLabel,
  IonText,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div className="request-modal-comments">
      <h3>💬 {t('comments.title', { count: comments.length })}</h3>

      {loadingComments ? (
        <p>{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p>{t('comments.noComments')}</p>
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
            <h4>{t('comments.addTitle')}</h4>
          </IonLabel>
          <textarea
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            placeholder={t('comments.placeholder')}
            rows={3}
            className="comment-textarea"
          />
          <IonButton
            expand="block"
            onClick={onSubmitComment}
            disabled={!newComment.trim() || submittingComment}
          >
            {submittingComment ? t('comments.posting') : t('comments.post')}
          </IonButton>
        </div>
      )}

      {!isAuthenticated && (
        <div className="login-prompt">
          <IonText color="medium">
            <p>{t('comments.loginPrompt')}</p>
          </IonText>
        </div>
      )}
    </div>
  );
};

export default CommentSection;

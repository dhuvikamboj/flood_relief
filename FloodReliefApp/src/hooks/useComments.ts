import { useState } from 'react';
import api from '../../services/api';
import secureStorage from '../../services/secureStorage';
import { useAuth } from '../contexts/AuthContext';
import { Comment } from '../types/resource';

export const useComments = () => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComments = async (resourceId: number) => {
    setLoadingComments(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/resources/${resourceId}/comments`;

      const cacheKey = `comments:${resourceId}`;
      // Serve cached comments first (secure storage or fallback)
      try {
        const cached = await secureStorage.getItem(cacheKey);
        if (cached) {
          setComments(JSON.parse(cached));
        }
      } catch (cacheErr) {
        // ignore
      }

      const res = await api.get(url);
      if (res.data && res.data.success) {
        setComments(res.data.data);
        try {
          await secureStorage.setItem(cacheKey, JSON.stringify(res.data.data));
        } catch (cacheErr) {
          // ignore
        }
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

  const submitComment = async (resourceId: number) => {
    if (!newComment.trim() || !isAuthenticated) return { success: false, message: 'Cannot submit comment' };

    setSubmittingComment(true);
    try {
      const base = (import.meta as any)?.env?.VITE_API_URL ?? 'https://floodrelief.davindersingh.dev';
      const url = `${base.replace(/\/$/, '')}/api/resources/${resourceId}/comments`;

      const res = await api.post(url, { comment: newComment.trim() });
      if (res.data && res.data.success) {
        // compute next comments list and set state
        const next = [...comments, res.data.data];
        setComments(next);
        // update cache (async, await here but not required for UI)
        try {
          await secureStorage.setItem(`comments:${resourceId}`, JSON.stringify(next));
        } catch (cacheErr) {
          // ignore
        }
        setNewComment('');
        return { success: true, message: 'Comment added successfully' };
      }
      return { success: false, message: 'Failed to add comment' };
    } catch (e: any) {
      console.error('Failed to submit comment', e);
      const errorMessage = e.response?.data?.message || 'Failed to add comment';
      return { success: false, message: errorMessage };
    } finally {
      setSubmittingComment(false);
    }
  };

  const resetComments = () => {
    setComments([]);
    setNewComment('');
  };

  return {
    comments,
    loadingComments,
    newComment,
    setNewComment,
    submittingComment,
    fetchComments,
    submitComment,
    resetComments,
  };
};

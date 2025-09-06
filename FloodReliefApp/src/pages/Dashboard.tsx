import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../config/api';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/react';
import { location, time, checkmarkCircle, alertCircle, hourglass } from 'ionicons/icons';
import axios from 'axios';
import api from '../../services/api';
import './Dashboard.css';
import { useTranslation } from 'react-i18next';

interface UserRequest {
  id: number;
  location: string;
  address?: string;
  contact?: string;
  priority: string;
  request_type?: string;
  details: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user token from localStorage or context
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError(t('dashboard.loginRequired'));
        return;
      }

      const base = getApiBaseUrl();
      const response = await axios.get(`${base}/api/user/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (response.data.success) {
        setUserRequests(response.data.data);
      } else {
        setError(t('dashboard.loadFailed'));
      }
    } catch (err: any) {
      console.error('Failed to fetch user requests:', err);
      setError(err.response?.data?.message || t('dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchUserRequests();
    event.detail.complete();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return checkmarkCircle;
      case 'in-progress': return hourglass;
      case 'pending': return alertCircle;
      default: return alertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStats = () => {
    const total = userRequests.length;
    const completed = userRequests.filter(r => r.status === 'completed').length;
    const inProgress = userRequests.filter(r => r.status === 'in-progress').length;
    const pending = userRequests.filter(r => r.status === 'pending').length;

    return { total, completed, inProgress, pending };
  };

  const stats = getStats();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('dashboard.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Stats Cards */}
        <div className="dashboard-header">
          <IonText color="primary">
            <h2>📊 {t('dashboard.header')}</h2>
          </IonText>

          <div className="stats-grid">
            <IonCard>
              <IonCardContent className="stat-card">
                <IonText color="primary">
                  <h1>{stats.total}</h1>
                </IonText>
                <p>{t('dashboard.totalRequests')}</p>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardContent className="stat-card">
                <IonText color="success">
                  <h1>{stats.completed}</h1>
                </IonText>
                <p>{t('dashboard.completed')}</p>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardContent className="stat-card">
                <IonText color="primary">
                  <h1>{stats.inProgress}</h1>
                </IonText>
                <p>{t('dashboard.inProgress')}</p>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardContent className="stat-card">
                <IonText color="warning">
                  <h1>{stats.pending}</h1>
                </IonText>
                <p>{t('dashboard.pending')}</p>
              </IonCardContent>
            </IonCard>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>{t('dashboard.loadingRequests')}</p>
          </div>
        ) : error ? (
          <IonCard>
            <IonCardContent>
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : userRequests.length === 0 ? (
          <IonCard>
            <IonCardContent className="empty-state">
              <IonIcon icon={alertCircle} size="large" color="medium" />
              <IonText color="medium">
                <h3>{t('dashboard.noRequestsTitle')}</h3>
                <p>{t('dashboard.noRequestsMsg')}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {userRequests.map((request) => (
              <IonItem key={request.id} className="request-item">
                <IonIcon
                  icon={getStatusIcon(request.status)}
                  slot="start"
                  color={getStatusColor(request.status)}
                />
                <IonLabel>
                  <h2>{request.location}</h2>
                  <p>
                    <strong>{t('common.type')}:</strong> {request.request_type || t('common.general')} •
                    <strong>{t('common.priority')}:</strong> {request.priority}
                  </p>
                  <p>{request.details}</p>
                  {request.address && <p><strong>Address:</strong> {request.address}</p>}
                  <div className="request-status-row">
                    <IonBadge color={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </IonBadge>
                    <small>
                      <IonIcon icon={time} />
                      {new Date(request.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;

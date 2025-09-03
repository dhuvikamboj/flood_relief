import React, { useState, useEffect } from 'react';
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
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAlert,
  IonLoading,
  IonText,
  IonList
} from '@ionic/react';
import {
  person,
  mail,
  call,
  location,
  logOut,
  save
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIonToast } from '@ionic/react';
import './Profile.css';

const Profile: React.FC = () => {
  const auth = useAuth() as any;
  const user = auth?.user;
  const isAuthenticated = auth?.isAuthenticated;
  const updateProfile = auth?.updateProfile;
  const logout = auth?.logout;
  const history = useHistory();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presentToast] = useIonToast();
console.log(auth);
console.log(user);

  // Mock user profile data - in real app, this would come from API
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    address: (user as any)?.address || '',
    emergencyContact: (user as any)?.emergency_contact || (user as any)?.emergencyContact || '',
    medicalInfo: (user as any)?.medical_info || 'No known allergies'
  });

  // Keep local form in sync when auth.user changes (e.g. after updateProfile)
  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '',
      address: (user as any)?.address || '',
      emergencyContact: (user as any)?.emergency_contact || (user as any)?.emergencyContact || '',
      medicalInfo: (user as any)?.medical_info || 'No known allergies'
    });
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveProfile = async () => {
    // Call API to save profile
    const payload = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      emergency_contact: profile.emergencyContact,
    };

    if (!updateProfile) {
      console.warn('No updateProfile available');
      setEditMode(false);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(payload);
      setEditMode(false);
      presentToast({
        message: 'Profile updated successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
    } catch (err: any) {
      console.error('Profile update failed', err);
      const msg = err?.response?.data?.message || 'Failed to update profile';
      presentToast({
        message: msg,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="profile-not-auth">
            <IonIcon icon={person} size="large" color="medium" />
            <IonText color="medium">
              <h2>Please log in to view your profile</h2>
            </IonText>
            <IonButton routerLink="/login">
              Go to Login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="profile-header">
          <IonIcon icon={person} size="large" color="primary" />
          <IonText color="primary">
            <h1>{profile.name}</h1>
          </IonText>
          <IonText color="medium">
            <p>{profile.email}</p>
          </IonText>
        </div>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Personal Information</IonCardTitle>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </IonButton>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonIcon icon={person} slot="start" />
                <IonLabel position="stacked">Full Name</IonLabel>
                <IonInput
                  value={profile.name}
                  onIonChange={(e) => setProfile({...profile, name: e.detail.value!})}
                  readonly={!editMode}
                />
              </IonItem>

              <IonItem>
                <IonIcon icon={mail} slot="start" />
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  value={profile.email}
                  onIonChange={(e) => setProfile({...profile, email: e.detail.value!})}
                  readonly={!editMode}
                />
              </IonItem>

              <IonItem>
                <IonIcon icon={call} slot="start" />
                <IonLabel position="stacked">Phone</IonLabel>
                <IonInput
                  value={profile.phone}
                  onIonChange={(e) => setProfile({...profile, phone: e.detail.value!})}
                  readonly={!editMode}
                />
              </IonItem>

              <IonItem>
                <IonIcon icon={location} slot="start" />
                <IonLabel position="stacked">Address</IonLabel>
                <IonInput
                  value={profile.address}
                  onIonChange={(e) => setProfile({...profile, address: e.detail.value!})}
                  readonly={!editMode}
                />
              </IonItem>
            </IonList>

          
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Emergency Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonIcon icon={call} slot="start" color="danger" />
                <IonLabel position="stacked">Emergency Contact</IonLabel>
                <IonInput
                  value={profile.emergencyContact}
                  onIonChange={(e) => setProfile({...profile, emergencyContact: e.detail.value!})}
                  readonly={!editMode}
                />
              </IonItem>

              <IonItem>
                <IonIcon icon={person} slot="start" color="warning" />
                <IonLabel position="stacked">Medical Information</IonLabel>
                <IonTextarea
                  value={profile.medicalInfo}
                  onIonChange={(e) => setProfile({...profile, medicalInfo: e.detail.value!})}
                  readonly={!editMode}
                  rows={3}
                />
              </IonItem>
            </IonList>
              {editMode && (
              <>
                <IonButton
                  expand="block"
                  onClick={handleSaveProfile}
                  className="save-button"
                  disabled={saving}
                >
                  <IonIcon icon={save} slot="start" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </IonButton>
                <IonLoading isOpen={saving} message="Saving profile..." />
              </>
            )}
          </IonCardContent>
        </IonCard>

        <div className="logout-section">
          <IonButton
            expand="block"
            color="danger"
            onClick={() => setShowLogoutAlert(true)}
          >
            <IonIcon icon={logOut} slot="start" />
            Logout
          </IonButton>
        </div>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Confirm Logout"
          message="Are you sure you want to logout?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Logout',
              role: 'destructive',
              handler: handleLogout
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;

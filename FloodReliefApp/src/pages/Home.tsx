import React from 'react';
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
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/react';
import {
  warning,
  call,
  documentText,
  person,
  water,
  map
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();

  const emergencyContacts = [
    // { name: 'Emergency Services', number: '911', icon: call, description: 'General emergency' },
    { name: 'Emergency Services', number: '112', icon: call, description: 'European emergency' },
    { name: 'Medical Emergency', number: '108', icon: warning, description: 'Medical assistance' },
    // { name: 'Flood Hotline', number: '1-800-FLOOD-HELP', icon: water, description: 'Flood information' },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flood Relief Hub</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="home-header">
          <IonIcon icon={water} size="large" color="primary" />
          <IonText color="primary">
            <h1>Flood Relief Services</h1>
          </IonText>
          <IonText color="medium">
            <p>Stay informed and help your community during flood emergencies</p>
          </IonText>
        </div>

        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/tabs/reports')}>
                <IonCardHeader>
                  <IonIcon icon={documentText} slot="start" color="primary" />
                  <IonCardTitle>Request Assistance</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Submit requests for assistance during flood emergencies to help authorities respond effectively.
                </IonCardContent>
              </IonCard>
            </IonCol>
        <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/tabs/reports')}>
                <IonCardHeader>
                  <IonIcon icon={documentText} slot="start" color="primary" />
                  <IonCardTitle>Available Resources</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  View and access available resources for flood relief efforts in your area.
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/')}>
                <IonCardHeader>
                  <IonIcon icon={map} slot="start" color="tertiary" />
                  <IonCardTitle>Maps — Help Needed & Available</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Quick view: where help is needed and where resources are available nearby.
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/tabs/profile')}>
                <IonCardHeader>
                  <IonIcon icon={person} slot="start" color="secondary" />
                  <IonCardTitle>My Profile</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Manage your account settings and emergency contact information.
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="emergency-section">
          <IonText color="danger">
            <h2>🚨 Emergency Contacts</h2>
          </IonText>
          <p className="emergency-subtitle">Quick access to emergency services during flood situations</p>

          {emergencyContacts.map((contact, index) => (
            <IonCard key={index} className="emergency-card">
              <IonCardContent className="emergency-contact">
                <IonIcon icon={contact.icon} color="danger" />
                <div className="contact-info">
                  <IonText>
                    <h3>{contact.name}</h3>
                  </IonText>
                  <IonText color="primary">
                    <p className="contact-number">{contact.number}</p>
                  </IonText>
                  <IonText color="medium">
                    <small>{contact.description}</small>
                  </IonText>
                </div>
                <IonButton
                  fill="solid"
                  color="danger"
                  href={`tel:${contact.number}`}
                  className="call-button"
                >
                  <IonIcon icon={call} slot="start" />
                  Call
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        <div className="safety-tips">
          <IonText color="warning">
            <h2>Safety Tips</h2>
          </IonText>
          <IonCard>
            <IonCardContent>
              <ul>
                <li>Move to higher ground immediately if flooding is imminent</li>
                <li>Avoid walking or driving through flood waters</li>
                <li>Stay informed via local news and emergency alerts</li>
                <li>Prepare an emergency kit with essential supplies</li>
                <li>Have an evacuation plan ready for your family</li>
              </ul>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

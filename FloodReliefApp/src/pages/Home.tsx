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
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

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
          <IonTitle>{t('home.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="home-header">
          <IonIcon icon={water} size="large" color="primary" />
          <IonText color="primary">
            <h1>{t('home.header')}</h1>
          </IonText>
          <IonText color="medium">
            <p>{t('home.subtitle')}</p>
          </IonText>
        </div>

        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/tabs/reports')}>
                <IonCardHeader>
                  <IonIcon icon={documentText} slot="start" color="primary" />
                  <IonCardTitle>{t('home.cards.requestAssistance.title')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.cards.requestAssistance.desc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
        <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/tabs/resources')}>
                <IonCardHeader>
                  <IonIcon icon={documentText} slot="start" color="primary" />
                  <IonCardTitle>{t('home.cards.availableResources.title')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.cards.availableResources.desc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/')}>
                <IonCardHeader>
                  <IonIcon icon={map} slot="start" color="tertiary" />
                  <IonCardTitle>{t('home.cards.maps.title')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.cards.maps.desc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <IonCard button onClick={() => history.push('/tabs/profile')}>
                <IonCardHeader>
                  <IonIcon icon={person} slot="start" color="secondary" />
                  <IonCardTitle>{t('home.cards.myProfile.title')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.cards.myProfile.desc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="emergency-section">
          <IonText color="danger">
            <h2>{t('home.emergency.title')}</h2>
          </IonText>
          <p className="emergency-subtitle">{t('home.emergency.subtitle')}</p>

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
                  {t('common.call')}
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        <div className="safety-tips">
          <IonText color="warning">
            <h2>{t('home.safety.title')}</h2>
          </IonText>
          <IonCard>
            <IonCardContent>
              <ul>
                <li>{t('home.safety.tip1')}</li>
                <li>{t('home.safety.tip2')}</li>
                <li>{t('home.safety.tip3')}</li>
                <li>{t('home.safety.tip4')}</li>
                <li>{t('home.safety.tip5')}</li>
              </ul>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

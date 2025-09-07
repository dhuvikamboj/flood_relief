import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, documentText, person, briefcase } from 'ionicons/icons';
import { setupIonicReact } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA4 from 'react-ga4';
import LanguageSelector from './components/LanguageSelector';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* i18n setup */
import './i18n';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ExploreLocationProvider } from './hooks/useExploreLocation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Reports from './pages/Reports';
import ReliefResources from './pages/ReliefResources';
import Profile from './pages/Profile';
import RequestForm from './pages/RequestForm';
import ResourceForm from './pages/ResourceForm';
import Landing from './pages/Landing';

setupIonicReact();

// Initialize Google Analytics 4
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID
ReactGA4.initialize('G-VM0KXNRQZB');

const AppTabs: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <IonTabs>
      <div className="app-language-wrapper">
        <LanguageSelector />
      </div>
      <IonRouterOutlet>
        <Route exact path="/tabs/home" component={Home} />
  <Route exact path="/tabs/request/new" component={RequestForm} />
        <Route exact path="/tabs/reports" component={Reports} />
        <Route exact path="/tabs/resources" component={ReliefResources} />
        <Route exact path="/tabs/resource/new" component={ResourceForm} />
        <Route exact path="/tabs/profile" component={Profile} />
        <Route exact path="/tabs" render={() => <Redirect to="/tabs/home" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={home} />
          <IonLabel>{t('navigation.home')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/tabs/reports" >
          <IonIcon icon={documentText} />
          <IonLabel>{t('navigation.reports')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="resources" href="/tabs/resources" >
          <IonIcon icon={briefcase} />
          <IonLabel>{t('navigation.resources')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={person} />
          <IonLabel>{t('navigation.profile')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

console.log(isAuthenticated);

  if (loading) {
    return (
      <IonApp>
        <div className="loading-container">
          <div>Loading...</div>
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <LocationTracker />
        <IonRouterOutlet>
            <Route path="/tabs" component={AppTabs} />
          <Route exact path="/" render={() => <Redirect to="/tabs/home" />} />
     
          <Route exact path="/login" component={Login} />
          <Route exact path="/signup" component={Signup} />
          <Route exact path="/" render={() => <Landing />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

// Component to track page views - must be inside Router context
const LocationTracker: React.FC = () => {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    ReactGA4.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);

  return null; // This component doesn't render anything
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <ExploreLocationProvider>
          <AppContent />
        </ExploreLocationProvider>
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;

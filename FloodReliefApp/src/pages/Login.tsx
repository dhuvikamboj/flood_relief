import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonAlert,
  IonLoading,
  IonText,
  IonRouterLink,
  IonSpinner
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { useIonToast } from '@ionic/react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const { login, loading } = useAuth();

  const [presentToast] = useIonToast();

  const clearErrors = () => {
    setErrors({
      email: '',
      password: '',
      general: ''
    });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleLogin = async () => {
    clearErrors();

    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Please enter your email address' }));
      return;
    }

    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: 'Please enter your password' }));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setLocalLoading(true);
    try {
      await login(email.trim(), password);
      presentToast({
        message: 'Login successful! Welcome back.',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      console.log('Showing success toast: Login successful! Welcome back.');
      // Small delay to show success message before navigation
      setTimeout(() => {
        window.location.href = '/tabs/home';
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          setErrors(prev => ({ ...prev, email: 'Invalid email or password' }));
        } else if (error.response.status === 422) {
          // Validation errors
          const apiErrors = error.response.data?.errors;
          if (apiErrors) {
            const fieldErrors = {
              email: apiErrors.email ? apiErrors.email[0] : '',
              password: apiErrors.password ? apiErrors.password[0] : '',
              general: ''
            };
            setErrors(fieldErrors);
          } else if (error.response.data?.message) {
            setErrors(prev => ({ ...prev, general: error.response.data.message }));
          } else {
            setErrors(prev => ({ ...prev, general: 'Please check your credentials' }));
          }
        } else if (error.response.data?.message) {
          setErrors(prev => ({ ...prev, general: error.response.data.message }));
        } else {
          setErrors(prev => ({ ...prev, general: 'Login failed. Please try again.' }));
        }
      } else if (error.request) {
        // Network error
        setErrors(prev => ({ ...prev, general: 'Network error. Please check your connection.' }));
      } else if (error.message) {
        setErrors(prev => ({ ...prev, general: error.message }));
      } else {
        setErrors(prev => ({ ...prev, general: 'An unexpected error occurred.' }));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flood Relief - Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={localLoading || loading} message="Logging in..." />

        <div className="login-header">
          <IonText color="primary">
            <h1>Welcome Back</h1>
          </IonText>
          <IonText color="medium">
            <p>Sign in to access flood relief services</p>
          </IonText>
        </div>

        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonInput={(e) => handleEmailChange(e.detail.value!)}
            placeholder="Enter your email"
            required
          />
        </IonItem>
        {errors.email && (
          <IonText color="danger" className="error-text">
            <small>{errors.email}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonInput={(e) => handlePasswordChange(e.detail.value!)}
            placeholder="Enter your password"
            required
          />
        </IonItem>
        {errors.password && (
          <IonText color="danger" className="error-text">
            <small>{errors.password}</small>
          </IonText>
        )}

        {errors.general && (
          <IonText color="danger" className="error-text general-error">
            <p>{errors.general}</p>
          </IonText>
        )}

        <IonButton
          expand="block"
          onClick={handleLogin}
          disabled={localLoading || loading || !email || !password}
          style={{ marginTop: '1rem' }}
        >
          {(localLoading || loading) ? (<><IonSpinner name="dots" /> Logging in...</>) : 'Login'}
        </IonButton>

        <div className="signup-link">
          <IonText>
            Don't have an account?{' '}
            <IonRouterLink routerLink="/signup">Sign up</IonRouterLink>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

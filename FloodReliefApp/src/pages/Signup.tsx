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
  IonLoading,
  IonText,
  IonRouterLink,
  IonSpinner
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { useIonToast } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import ReactGA4 from 'react-ga4';
import './Signup.css';

const Signup: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    emergencyContact: '',
    general: ''
  });
  const { register } = useAuth();
  const [presentToast] = useIonToast();
  // use a local-only loading flag to avoid relying on any global/auth loading state
  const [localLoading, setLocalLoading] = useState(false);

  const clearErrors = () => {
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
  phone: '',
  address: '',
  emergencyContact: '',
  general: ''
    });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
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

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
  };

  const handleEmergencyContactChange = (value: string) => {
    setEmergencyContact(value);
    if (errors.emergencyContact) setErrors(prev => ({ ...prev, emergencyContact: '' }));
  };

  const handleSignup = async () => {
    clearErrors();

    // Basic validation
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: t('signup.errors.enterFullName') }));
      return;
    }

    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: t('signup.errors.enterEmail') }));
      return;
    }

    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: t('signup.errors.enterPassword') }));
      return;
    }

    if (!confirmPassword.trim()) {
      setErrors(prev => ({ ...prev, confirmPassword: t('signup.errors.confirmPassword') }));
      return;
    }

    // Optional phone validation
    if (phone && phone.length < 6) {
      setErrors(prev => ({ ...prev, phone: t('signup.errors.validPhone') }));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: t('signup.errors.validEmail') }));
      return;
    }

    // Password validation
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: t('signup.errors.passwordLength') }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: t('signup.errors.passwordsDoNotMatch') }));
      return;
    }

    // Track signup attempt
    ReactGA4.event('sign_up_attempt', {
      method: 'email'
    });

    try {
      setLocalLoading(true);
  // register may have an extended signature; cast to any to forward extra fields
  await (register as any)(email.trim(), password, name.trim(), confirmPassword,phone.trim(), address.trim(), emergencyContact.trim());
      // Track successful signup
      ReactGA4.event('sign_up', {
        method: 'email'
      });
      presentToast({
        message: t('signup.success.accountCreated'),
        duration: 3000,
        color: 'success',
        position: 'top',
        onDidDismiss: () => {
         window.location.href = '/tabs/reports';
        }
      });
      console.log('Showing success toast: Account created successfully! Welcome to Flood Relief.');
      // Small delay to show success message before navigation
      setTimeout(() => {
        window.location.href = '/tabs/home';
      }, 1500);
    } catch (error: any) {
      console.error('Signup error:', error);
      // Track signup failure
      ReactGA4.event('sign_up_failure', {
        method: 'email',
        error_type: error.response?.status?.toString() || 'unknown'
      });

      if (error.response) {
        // Server responded with error
        if (error.response.status === 422) {
          // Validation errors - map to specific fields
          const apiErrors = error.response.data?.errors;
          if (apiErrors) {
            const fieldErrors = {
              name: apiErrors.name ? apiErrors.name[0] : '',
              email: apiErrors.email ? apiErrors.email[0] : '',
              password: apiErrors.password ? apiErrors.password[0] : '',
              confirmPassword: '',
              phone: apiErrors.phone ? apiErrors.phone[0] : '',
              address: apiErrors.address ? apiErrors.address[0] : '',
              emergencyContact: apiErrors.emergency_contact ? apiErrors.emergency_contact[0] : '',
              general: ''
            };
            setErrors(fieldErrors);
          } else if (error.response.data?.message) {
            setErrors(prev => ({ ...prev, general: error.response.data.message }));
          } else {
            setErrors(prev => ({ ...prev, general: t('signup.errors.checkInfo') }));
          }
        } else if (error.response.status === 409) {
          setErrors(prev => ({ ...prev, email: t('signup.errors.accountExists') }));
        } else if (error.response.data?.message) {
          setErrors(prev => ({ ...prev, general: error.response.data.message }));
        } else {
          setErrors(prev => ({ ...prev, general: t('signup.errors.registrationFailed') }));
        }
      } else if (error.message) {
        setErrors(prev => ({ ...prev, general: error.message }));
      } else if (error.request) {
        // Network error
        setErrors(prev => ({ ...prev, general: t('signup.errors.networkError') }));
      } else {
        setErrors(prev => ({ ...prev, general: t('signup.errors.unexpectedError') }));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('signup.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={localLoading} message={t('signup.loading')} />

        <div className="signup-header">
          <IonText color="primary">
            <h1>{t('signup.joinFloodRelief')}</h1>
          </IonText>
          <IonText color="medium">
            <p>{t('signup.createAccount')}</p>
          </IonText>
        </div>

        <IonItem>
          <IonLabel position="stacked">{t('signup.fullName')}</IonLabel>
          <IonInput
            value={name}
            onIonInput={(e) => handleNameChange(e.detail.value!)}
            placeholder={t('signup.placeholders.fullName')}
            required
          />
        </IonItem>
        {errors.name && (
          <IonText color="danger" className="error-text">
            <small>{errors.name}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">{t('signup.email')}</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonInput={(e) => handleEmailChange(e.detail.value!)}
            placeholder={t('signup.placeholders.email')}
            required
          />
        </IonItem>
        {errors.email && (
          <IonText color="danger" className="error-text">
            <small>{errors.email}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">{t('signup.password')}</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonInput={(e) => handlePasswordChange(e.detail.value!)}
            placeholder={t('signup.placeholders.password')}
            required
          />
        </IonItem>
        {errors.password && (
          <IonText color="danger" className="error-text">
            <small>{errors.password}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">{t('signup.confirmPassword')}</IonLabel>
          <IonInput
            type="password"
            value={confirmPassword}
            onIonInput={(e) => handleConfirmPasswordChange(e.detail.value!)}
            placeholder={t('signup.placeholders.confirmPassword')}
            required
          />
        </IonItem>
        {errors.confirmPassword && (
          <IonText color="danger" className="error-text">
            <small>{errors.confirmPassword}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">{t('signup.phone')} ({t('signup.optional')})</IonLabel>
          <IonInput
            type="tel"
            value={phone}
            onIonInput={(e) => handlePhoneChange(e.detail.value!)}
            placeholder={t('signup.placeholders.phone')}
          />
        </IonItem>
        {errors.phone && (
          <IonText color="danger" className="error-text">
            <small>{errors.phone}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">{t('signup.address')} ({t('signup.optional')})</IonLabel>
          <IonInput
            value={address}
            onIonInput={(e) => handleAddressChange(e.detail.value!)}
            placeholder={t('signup.placeholders.address')}
          />
        </IonItem>
        {errors.address && (
          <IonText color="danger" className="error-text">
            <small>{errors.address}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">{t('signup.emergencyContact')} ({t('signup.optional')})</IonLabel>
          <IonInput
            value={emergencyContact}
            onIonInput={(e) => handleEmergencyContactChange(e.detail.value!)}
            placeholder={t('signup.placeholders.emergencyContact')}
          />
        </IonItem>
        {errors.emergencyContact && (
          <IonText color="danger" className="error-text">
            <small>{errors.emergencyContact}</small>
          </IonText>
        )}

        {errors.general && (
          <IonText color="danger" className="error-text general-error">
            <p>{errors.general}</p>
          </IonText>
        )}

        <IonButton
          expand="block"
          onClick={handleSignup}
          disabled={localLoading || !name || !email || !password || !confirmPassword}
          className="signup-button"
        >
          {localLoading ? (<><IonSpinner name="dots" /> {t('signup.creating')}...</>) : t('signup.signUp')}
        </IonButton>

        <div className="login-link">
          <IonText>
            {t('signup.alreadyHaveAccount')} {' '}
            <IonRouterLink routerLink="/login">{t('signup.login')}</IonRouterLink>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;

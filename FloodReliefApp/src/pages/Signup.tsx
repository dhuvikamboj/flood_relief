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
import './Signup.css';

const Signup: React.FC = () => {
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
      setErrors(prev => ({ ...prev, name: 'Please enter your full name' }));
      return;
    }

    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Please enter your email address' }));
      return;
    }

    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: 'Please enter a password' }));
      return;
    }

    if (!confirmPassword.trim()) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return;
    }

    // Optional phone validation
    if (phone && phone.length < 6) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    // Password validation
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters long' }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    try {
      setLocalLoading(true);
  // register may have an extended signature; cast to any to forward extra fields
  await (register as any)(email.trim(), password, name.trim(), confirmPassword,phone.trim(), address.trim(), emergencyContact.trim());
      presentToast({
        message: 'Account created successfully! Welcome to Flood Relief.',
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
            setErrors(prev => ({ ...prev, general: 'Please check your information and try again' }));
          }
        } else if (error.response.status === 409) {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
        } else if (error.response.data?.message) {
          setErrors(prev => ({ ...prev, general: error.response.data.message }));
        } else {
          setErrors(prev => ({ ...prev, general: 'Registration failed. Please try again.' }));
        }
      } else if (error.request) {
        // Network error
        setErrors(prev => ({ ...prev, general: 'Network error. Please check your connection and try again.' }));
      } else {
        setErrors(prev => ({ ...prev, general: 'An unexpected error occurred. Please try again.' }));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flood Relief - Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={localLoading} message="Creating account..." />

        <div className="signup-header">
          <IonText color="primary">
            <h1>Join Flood Relief</h1>
          </IonText>
          <IonText color="medium">
            <p>Create an account to help your community</p>
          </IonText>
        </div>

        <IonItem>
          <IonLabel position="stacked">Full Name</IonLabel>
          <IonInput
            value={name}
            onIonChange={(e) => handleNameChange(e.detail.value!)}
            placeholder="Enter your full name"
            required
          />
        </IonItem>
        {errors.name && (
          <IonText color="danger" className="error-text">
            <small>{errors.name}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => handleEmailChange(e.detail.value!)}
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
            onIonChange={(e) => handlePasswordChange(e.detail.value!)}
            placeholder="Enter your password"
            required
          />
        </IonItem>
        {errors.password && (
          <IonText color="danger" className="error-text">
            <small>{errors.password}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Confirm Password</IonLabel>
          <IonInput
            type="password"
            value={confirmPassword}
            onIonChange={(e) => handleConfirmPasswordChange(e.detail.value!)}
            placeholder="Confirm your password"
            required
          />
        </IonItem>
        {errors.confirmPassword && (
          <IonText color="danger" className="error-text">
            <small>{errors.confirmPassword}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Phone (optional)</IonLabel>
          <IonInput
            type="tel"
            value={phone}
            onIonChange={(e) => handlePhoneChange(e.detail.value!)}
            placeholder="Enter a phone number"
          />
        </IonItem>
        {errors.phone && (
          <IonText color="danger" className="error-text">
            <small>{errors.phone}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Address (optional)</IonLabel>
          <IonInput
            value={address}
            onIonChange={(e) => handleAddressChange(e.detail.value!)}
            placeholder="Enter an address"
          />
        </IonItem>
        {errors.address && (
          <IonText color="danger" className="error-text">
            <small>{errors.address}</small>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Emergency Contact (optional)</IonLabel>
          <IonInput
            value={emergencyContact}
            onIonChange={(e) => handleEmergencyContactChange(e.detail.value!)}
            placeholder="Enter an emergency contact name or number"
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
          {localLoading ? (<><IonSpinner name="dots" /> Creating...</>) : 'Sign Up'}
        </IonButton>

        <div className="login-link">
          <IonText>
            Already have an account?{' '}
            <IonRouterLink routerLink="/login">Login</IonRouterLink>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;

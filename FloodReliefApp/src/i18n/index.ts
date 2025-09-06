import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import pa from './pa.json';
import hi from './hi.json';

const resources = {
  en: {
    translation: en
  },
  pa: {
    translation: pa
  },
  hi: {
    translation: hi
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('flood-relief-language') || 'en',
    
    keySeparator: '.',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'flood-relief-language'
    }
  });

export default i18n;

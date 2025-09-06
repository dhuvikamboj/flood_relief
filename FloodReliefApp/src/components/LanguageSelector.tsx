import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="language-selector">
      <IonSelect
        value={i18n.language}
        onIonChange={(e) => changeLanguage(e.detail.value)}
        interface="popover"
        aria-label="Language selector"
      >
        <IonSelectOption value="en">English</IonSelectOption>
        <IonSelectOption value="pa">ਪੰਜਾਬੀ</IonSelectOption>
        <IonSelectOption value="hi">हिन्दी</IonSelectOption>
      </IonSelect>
    </div>
  );
};

export default LanguageSelector;

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  IonButton,
  IonIcon,
  IonPopover,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox
} from '@ionic/react';
import { languageOutline } from 'ionicons/icons';

interface LanguageSwitcherProps {
  showPopover: boolean;
  setShowPopover: (show: boolean) => void;
  popoverEvent?: Event;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showPopover,
  setShowPopover,
  popoverEvent
}) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('flood-relief-language', languageCode);
    setShowPopover(false);
  };

  const getCurrentLanguageName = () => {
    const currentLang = languages.find(lang => lang.code === i18n.language);
    return currentLang?.nativeName || 'English';
  };

  return (
    <>
      <IonButton
        fill="clear"
        onClick={(e) => {
          setShowPopover(true);
        }}
        id="language-trigger"
      >
        <IonIcon icon={languageOutline} slot="start" />
        {getCurrentLanguageName()}
      </IonButton>

      <IonPopover
        trigger="language-trigger"
        isOpen={showPopover}
        onDidDismiss={() => setShowPopover(false)}
        showBackdrop={true}
      >
        <IonContent>
          <IonList>
            {languages.map((language) => (
              <IonItem
                key={language.code}
                button
                onClick={() => changeLanguage(language.code)}
              >
                <IonCheckbox
                  slot="start"
                  checked={i18n.language === language.code}
                  disabled
                />
                <IonLabel>
                  <h3>{language.nativeName}</h3>
                  <p>{language.name}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonPopover>
    </>
  );
};

export default LanguageSwitcher;

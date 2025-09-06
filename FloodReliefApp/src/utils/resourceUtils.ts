import { 
  checkmark, 
  checkmarkDone, 
  warning, 
  trash, 
  restaurant, 
  medkit, 
  home, 
  water, 
  briefcase, 
  location as locationIcon 
} from 'ionicons/icons';
import i18n from 'i18next';

export const getAvailabilityColor = (availability: string) => {
  switch (availability.toLowerCase()) {
    case 'available': return 'success';
    case 'limited': return 'warning';
    case 'unavailable': return 'danger';
    default: return 'medium';
  }
};

export const getAvailabilityText = (availability: string) => {
  if (!availability) return availability || 'Unknown';
  switch (availability?.toLowerCase()) {
    case 'available': return i18n.t('resourceForm.availability.available');
    case 'limited': return i18n.t('resourceForm.availability.limited');
    case 'unavailable': return i18n.t('resourceForm.availability.unavailable');
    default: return availability || 'Unknown';
  }
};

export const getAvailabilityIcon = (availability: string) => {
  switch (availability.toLowerCase()) {
    case 'available': return checkmarkDone;
    case 'limited': return warning;
    case 'unavailable': return trash;
    default: return checkmark;
  }
};

export const getAvailabilityIconColor = (availability: string) => {
  switch (availability.toLowerCase()) {
    case 'available': return '#10dc60'; // success color
    case 'limited': return '#ffce00'; // warning color
    case 'unavailable': return '#f04141'; // danger color
    default: return '#92949c'; // medium color
  }
};

export const getResourceTypeIcon = (resourceType?: string) => {
  switch (resourceType?.toLowerCase()) {
    case 'food': return restaurant;
    case 'medical': return medkit;
    case 'shelter': return home;
    case 'water': return water;
    case 'supplies': return briefcase;
    default: return locationIcon;
  }
};

export const getResourceTypeColor = (resourceType?: string) => {
  switch (resourceType?.toLowerCase()) {
    case 'food': return 'warning';
    case 'medical': return 'danger';
    case 'shelter': return 'primary';
    case 'water': return 'tertiary';
    case 'supplies': return 'secondary';
    default: return 'medium';
  }
};

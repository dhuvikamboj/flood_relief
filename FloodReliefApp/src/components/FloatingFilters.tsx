import React, { useState } from 'react';
import {
  IonFab,
  IonFabButton,
  IonIcon,
  IonPopover,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonRange,
  IonLabel,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { getAvailabilityText } from '../utils/resourceUtils';
import { 
  options, 
  close, 
  funnelOutline, 
  searchOutline, 
  layersOutline, 
  checkmarkCircleOutline,
  refreshOutline,
  checkmarkOutline 
} from 'ionicons/icons';
import { ResourceFilters as ResourceFiltersType } from '../types/resource';
import ResourceFilters from './ResourceFilters';
import './FloatingFilters.css';

interface FloatingFiltersProps {
  filters: ResourceFiltersType;
  onFiltersChange: (filters: Partial<ResourceFiltersType>) => void;
}

const FloatingFilters: React.FC<FloatingFiltersProps> = ({ filters, onFiltersChange }) => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.availabilityFilter !== 'all') count++;
    if (filters.typeFilter !== 'all') count++;
    if (filters.myResourcesFilter) count++;
    if (filters.searchTerm.trim()) count++;
    if (filters.searchRadius !== 5) count++; // 5 is default
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handleClearFilters = () => {
    onFiltersChange({
      searchRadius: 5,
      availabilityFilter: 'all',
      typeFilter: 'all',
      myResourcesFilter: false,
      searchTerm: '',
    });
  };

  return (
    <>
      <IonFab slot="fixed" vertical="bottom" horizontal="end" className="floating-filters-fab">
        <IonFabButton 
          id="filter-fab"
          className="filter-fab-button"
          onClick={() => setIsPopoverOpen(true)}
        >
          <IonIcon icon={options} />
          {activeFilterCount > 0 && (
            <div className="filter-badge">
              {activeFilterCount}
            </div>
          )}
        </IonFabButton>
      </IonFab>

      <IonPopover 
        className='filter-popover'
        trigger="filter-fab" 
        isOpen={isPopoverOpen}
        onDidDismiss={() => setIsPopoverOpen(false)}
        showBackdrop={true}
        side="top"
        alignment="center"
        size="auto"
        backdropDismiss={true}
      >
        <div className="filter-popover-content">
          <IonHeader className="filter-popover-header">
            <IonToolbar>
              <IonTitle size="small">
                <IonIcon icon={funnelOutline} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                {t('filters.title')}
              </IonTitle>
              <IonButton 
                slot="end" 
                fill="clear" 
                size="small"
                onClick={() => setIsPopoverOpen(false)}
                title={t('common.close')}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent>
            <div className="filter-popover-body">
              <div className="filter-section">
                <div className="filter-section-title">
                  <IonIcon icon={searchOutline} />
                  {t('filters.searchLocation')}
                </div>
                
                <div className="filter-row">
                  <input
                    type="text"
                    className="search-input"
                    placeholder={t('filters.searchPlaceholder')}
                    value={filters.searchTerm}
                    onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
                  />
                </div>
                
                <div className="filter-row">
                  <IonLabel>{t('filters.radius', { value: filters.searchRadius })}</IonLabel>
                  <div className="radius-control">
                    <IonRange
                      className="radius-slider"
                      min={1}
                      max={50}
                      step={1}
                      value={filters.searchRadius}
                      onIonInput={(e) => onFiltersChange({ searchRadius: e.detail.value as number })}
                      pin={true}
                      pinFormatter={(value: number) => `${value}km`}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">
                  <IonIcon icon={layersOutline} />
                  {t('filters.title')}
                </div>
                
                <div className="filter-row">
                  <select 
                    className="filter-select"
                    value={filters.typeFilter} 
                    onChange={(e) => onFiltersChange({ typeFilter: e.target.value as 'all' | 'food' | 'shelter' | 'medical' | 'transportation' | 'clothing' | 'other' })}
                    aria-label="Select resource type"
                  >
                    <option value="all">{t('filters.types.all')}</option>
                    <option value="food">🍲 {t('filters.types.food')}</option>
                    <option value="shelter">🏠 {t('filters.types.shelter')}</option>
                    <option value="medical">⚕️ {t('filters.types.medical')}</option>
                    <option value="transportation">🚐 {t('filters.types.transportation')}</option>
                    <option value="clothing">👕 {t('filters.types.clothing')}</option>
                    <option value="other">🔧 {t('filters.types.other')}</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <select 
                    className="filter-select"
                    value={filters.availabilityFilter} 
                    onChange={(e) => onFiltersChange({ availabilityFilter: e.target.value as 'all' | 'available' | 'requested' })}
                    aria-label="Select availability filter"
                  >
                    <option value="all">{t('filters.availability.all')}</option>
                    <option value="available">✅ {t('filters.availability.available')}</option>
                    <option value="limited">⚠️ {t('filters.availability.limited')}</option>
                    <option value="unavailable">❌ {t('filters.availability.unavailable')}</option>
                  </select>
                </div>

                <div className="filter-checkbox-row" onClick={() => onFiltersChange({ myResourcesFilter: !filters.myResourcesFilter })}>
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={filters.myResourcesFilter}
                    onChange={(e) => onFiltersChange({ myResourcesFilter: e.target.checked })}
                    aria-label="Show only my resources"
                  />
                  <label className="filter-checkbox-label">
                    {t('filters.myResourcesOnly')}
                  </label>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="filter-summary-active">
                  <div className="filter-summary-title">
                    {t('reports.activeFilters')}
                  </div>
                  <div className="filter-summary-items">
                    {filters.myResourcesFilter && <div>{t('filters.myResourcesOnly')}</div>}
                    {filters.availabilityFilter !== 'all' && <div>{t('filters.availability.label')}: {getAvailabilityText(filters.availabilityFilter)}</div>}
                    {filters.typeFilter !== 'all' && <div>{t('filters.typeLabel')}: {t(`filters.types.${filters.typeFilter}`) || filters.typeFilter}</div>}
                    {filters.searchTerm.trim() && <div>{t('filters.search')}: "{filters.searchTerm}"</div>}
                    {filters.searchRadius !== 5 && <div>{t('filters.radius', { value: filters.searchRadius })}</div>}
                  </div>
                </div>
              )}

              <div className="filter-actions">
                <IonButton 
                  fill="outline" 
                  expand="full" 
                  onClick={handleClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  {t('filters.clearAll')}
                </IonButton>
                <IonButton 
                  expand="full"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  <IonIcon icon={checkmarkOutline} slot="start" />
                  {t('filters.apply')}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </div>
      </IonPopover>
    </>
  );
};

export default FloatingFilters;

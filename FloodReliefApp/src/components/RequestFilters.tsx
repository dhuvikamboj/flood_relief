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
import './FloatingFilters.css';
import { useTranslation } from 'react-i18next';

export interface RequestFilters {
  searchRadius: number;
  statusFilter: string;
  priorityFilter: string;
  typeFilter: string;
  myRequestsFilter: boolean;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface RequestFiltersProps {
  filters: RequestFilters;
  onFiltersChange: (filters: Partial<RequestFilters>) => void;
  landing?: boolean;
}

const RequestFilters: React.FC<RequestFiltersProps> = ({ filters, onFiltersChange,landing }) => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.statusFilter !== 'all') count++;
    if (filters.priorityFilter !== 'all') count++;
    if (filters.typeFilter !== 'all') count++;
    if (filters.myRequestsFilter) count++;
    if (filters.searchTerm.trim()) count++;
    if (filters.searchRadius !== 5) count++; // 5 is default
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handleClearFilters = () => {
    onFiltersChange({
      searchRadius: 5,
      statusFilter: 'all',
      priorityFilter: 'all',
      typeFilter: 'all',
      myRequestsFilter: false,
      searchTerm: '',
      sortBy: 'distance_km',
      sortOrder: 'asc',
    });
  };

  return (
    <>
      <IonFab slot="fixed" vertical="bottom" horizontal={landing ? "start" : "end"} className="floating-filters-fab">
        <IonFabButton 
          id="request-filter-fab"
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
        trigger="request-filter-fab" 
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
              >
                <IonIcon icon={close} title={t('common.close') as any} />
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
                      max={500}
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
                  <IonLabel>{t('requestFilters.statusLabel')}</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.statusFilter} 
                    onChange={(e) => onFiltersChange({ statusFilter: e.target.value })}
                    aria-label="Select status filter"
                  >
                    <option value="all">{t('requestFilters.status.all')}</option>
                    <option value="pending">⏳ {t('requestFilters.status.pending')}</option>
                    <option value="in-progress">🔄 {t('requestFilters.status.inProgress')}</option>
                    <option value="completed">✅ {t('requestFilters.status.completed')}</option>
                    <option value="cancelled">❌ {t('requestFilters.status.cancelled')}</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <IonLabel>{t('requestFilters.priorityLabel')}</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.priorityFilter} 
                    onChange={(e) => onFiltersChange({ priorityFilter: e.target.value })}
                    aria-label="Select priority filter"
                  >
                    <option value="all">{t('requestFilters.priority.all')}</option>
                    <option value="high">🔴 {t('requestFilters.priority.high')}</option>
                    <option value="medium">🟡 {t('requestFilters.priority.medium')}</option>
                    <option value="low">🟢 {t('requestFilters.priority.low')}</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <IonLabel>{t('requestFilters.typeLabel')}</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.typeFilter} 
                    onChange={(e) => onFiltersChange({ typeFilter: e.target.value })}
                    aria-label="Select request type"
                  >
                    <option value="all">{t('filters.types.all')}</option>
                    <option value="medical">⚕️ {t('filters.types.medical')}</option>
                    <option value="food">🍲 {t('filters.types.food')}</option>
                    <option value="shelter">🏠 {t('filters.types.shelter')}</option>
                    <option value="water">💧 {t('filters.types.water')}</option>
                    <option value="supplies">📦 {t('filters.types.supplies')}</option>
                  </select>
                </div>

                <div className="filter-checkbox-row" onClick={() => onFiltersChange({ myRequestsFilter: !filters.myRequestsFilter })}>
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={filters.myRequestsFilter}
                    onChange={(e) => onFiltersChange({ myRequestsFilter: e.target.checked })}
                    aria-label="Show only my requests"
                  />
                  <label className="filter-checkbox-label">
                    {t('requestFilters.myRequestsOnly')}
                  </label>
                </div>
              </div>

                <div className="filter-section">
                <div className="filter-section-title">
                  <IonIcon icon={layersOutline} />
                  {t('filters.sortingLabel')}
                </div>
                
                <div className="filter-row">
                  <IonLabel>{t('filters.sorting.distance')}</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.sortBy} 
                    onChange={(e) => onFiltersChange({ sortBy: e.target.value })}
                    aria-label="Select sort criteria"
                  >
                    <option value="distance_km">📏 {t('filters.sorting.distance')}</option>
                    <option value="priority">⚠️ {t('filters.sorting.capacity') /* capacity used for priority label fallback */}</option>
                    <option value="timestamp">📅 {t('filters.sorting.date')}</option>
                    <option value="status">📊 {t('filters.sorting.availability')}</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <IonLabel>{t('filters.order')}</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.sortOrder} 
                    onChange={(e) => onFiltersChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
                    aria-label="Select sort order"
                  >
                    <option value="asc">⬆️ {t('filters.orderAsc')}</option>
                    <option value="desc">⬇️ {t('filters.orderDesc')}</option>
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="filter-summary-active">
                  <div className="filter-summary-title">
                    {t('reports.activeFilters')}
                  </div>
                  <div className="filter-summary-items">
                    {filters.myRequestsFilter && <div>{t('requestFilters.myRequestsOnly')}</div>}
                    {filters.statusFilter !== 'all' && <div>{t('requestFilters.statusLabel')}: {t(`requestFilters.status.${filters.statusFilter}`) || filters.statusFilter}</div>}
                    {filters.priorityFilter !== 'all' && <div>{t('requestFilters.priorityLabel')}: {t(`requestFilters.priority.${filters.priorityFilter}`) || filters.priorityFilter}</div>}
                    {filters.typeFilter !== 'all' && <div>{t('requestFilters.typeLabel')}: {t(`requestFilters.type.${filters.typeFilter}`) || filters.typeFilter}</div>}
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

export default RequestFilters;

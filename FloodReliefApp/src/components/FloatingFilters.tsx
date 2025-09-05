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
import { ResourceFilters as ResourceFiltersType } from '../types/resource';
import ResourceFilters from './ResourceFilters';
import './FloatingFilters.css';

interface FloatingFiltersProps {
  filters: ResourceFiltersType;
  onFiltersChange: (filters: Partial<ResourceFiltersType>) => void;
}

const FloatingFilters: React.FC<FloatingFiltersProps> = ({ filters, onFiltersChange }) => {
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
                Filters
              </IonTitle>
              <IonButton 
                slot="end" 
                fill="clear" 
                size="small"
                onClick={() => setIsPopoverOpen(false)}
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
                  Search & Location
                </div>
                
                <div className="filter-row">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search resources..."
                    value={filters.searchTerm}
                    onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
                  />
                </div>
                
                <div className="filter-row">
                  <IonLabel>Radius: {filters.searchRadius} km</IonLabel>
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
                  Filters
                </div>
                
                <div className="filter-row">
                  <select 
                    className="filter-select"
                    value={filters.typeFilter} 
                    onChange={(e) => onFiltersChange({ typeFilter: e.target.value as 'all' | 'food' | 'shelter' | 'medical' | 'transportation' | 'clothing' | 'other' })}
                    aria-label="Select resource type"
                  >
                    <option value="all">All types</option>
                    <option value="food">🍲 Food & Water</option>
                    <option value="shelter">🏠 Shelter</option>
                    <option value="medical">⚕️ Medical</option>
                    <option value="transportation">🚐 Transport</option>
                    <option value="clothing">👕 Clothing</option>
                    <option value="other">🔧 Other</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <select 
                    className="filter-select"
                    value={filters.availabilityFilter} 
                    onChange={(e) => onFiltersChange({ availabilityFilter: e.target.value as 'all' | 'available' | 'requested' })}
                    aria-label="Select availability filter"
                  >
                    <option value="all">All resources</option>
                    <option value="available">✅ Available</option>
                    <option value="limited">⚠️ Limited</option>
                    <option value="unavailable">❌ Unavailable</option>
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
                    My resources only
                  </label>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="filter-summary-active">
                  <div className="filter-summary-title">
                    Active Filters
                  </div>
                  <div className="filter-summary-items">
                    {filters.myResourcesFilter && <div>My Resources Only</div>}
                    {filters.availabilityFilter !== 'all' && <div>Availability: {filters.availabilityFilter}</div>}
                    {filters.typeFilter !== 'all' && <div>Type: {filters.typeFilter}</div>}
                    {filters.searchTerm.trim() && <div>Search: "{filters.searchTerm}"</div>}
                    {filters.searchRadius !== 5 && <div>Radius: {filters.searchRadius} km</div>}
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
                  Clear All
                </IonButton>
                <IonButton 
                  expand="full"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  <IonIcon icon={checkmarkOutline} slot="start" />
                  Apply Filters
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

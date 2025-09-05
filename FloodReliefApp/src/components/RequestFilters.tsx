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
                    placeholder="Search location, details, reporter..."
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
                  Filters
                </div>
                
                <div className="filter-row">
                  <IonLabel>Status:</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.statusFilter} 
                    onChange={(e) => onFiltersChange({ statusFilter: e.target.value })}
                    aria-label="Select status filter"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <IonLabel>Priority:</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.priorityFilter} 
                    onChange={(e) => onFiltersChange({ priorityFilter: e.target.value })}
                    aria-label="Select priority filter"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <IonLabel>Type:</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.typeFilter} 
                    onChange={(e) => onFiltersChange({ typeFilter: e.target.value })}
                    aria-label="Select request type"
                  >
                    <option value="all">All Types</option>
                    <option value="medical">⚕️ Medical</option>
                    <option value="food">🍲 Food</option>
                    <option value="shelter">🏠 Shelter</option>
                    <option value="water">💧 Water</option>
                    <option value="supplies">📦 Supplies</option>
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
                    My requests only
                  </label>
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">
                  <IonIcon icon={layersOutline} />
                  Sorting
                </div>
                
                <div className="filter-row">
                  <IonLabel>Sort by:</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.sortBy} 
                    onChange={(e) => onFiltersChange({ sortBy: e.target.value })}
                    aria-label="Select sort criteria"
                  >
                    <option value="distance_km">📏 Distance</option>
                    <option value="priority">⚠️ Priority</option>
                    <option value="timestamp">📅 Date</option>
                    <option value="status">📊 Status</option>
                  </select>
                </div>
                
                <div className="filter-row">
                  <IonLabel>Order:</IonLabel>
                  <select 
                    className="filter-select"
                    value={filters.sortOrder} 
                    onChange={(e) => onFiltersChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
                    aria-label="Select sort order"
                  >
                    <option value="asc">⬆️ Ascending</option>
                    <option value="desc">⬇️ Descending</option>
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="filter-summary-active">
                  <div className="filter-summary-title">
                    Active Filters
                  </div>
                  <div className="filter-summary-items">
                    {filters.myRequestsFilter && <div>My Requests Only</div>}
                    {filters.statusFilter !== 'all' && <div>Status: {filters.statusFilter}</div>}
                    {filters.priorityFilter !== 'all' && <div>Priority: {filters.priorityFilter}</div>}
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

export default RequestFilters;

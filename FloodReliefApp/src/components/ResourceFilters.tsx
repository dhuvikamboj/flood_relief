import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  IonLabel,
  IonRange,
  IonText,
} from '@ionic/react';
import { ResourceFilters as ResourceFiltersType } from '../types/resource';
import { getAvailabilityText } from '../utils/resourceUtils';

interface ResourceFiltersProps {
  filters: ResourceFiltersType;
  onFiltersChange: (filters: Partial<ResourceFiltersType>) => void;
}

interface ResourceFiltersProps {
  filters: ResourceFiltersType;
  onFiltersChange: (filters: Partial<ResourceFiltersType>) => void;
  showTitle?: boolean;
  compact?: boolean;
}

const ResourceFilters: React.FC<ResourceFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  showTitle = true,
  compact = false 
}) => {
  const { t } = useTranslation();

  return (
    <div className={compact ? 'filters-compact' : ''}>
      {/* Radius Control */}
      <div className="radius-control">
        <IonLabel>
          <small>{t('filters.radius', { value: filters.searchRadius })}</small>
        </IonLabel>
        <IonRange
          min={1}
          max={500}
          step={1}
          value={filters.searchRadius}
          onIonChange={(e) => onFiltersChange({ searchRadius: e.detail.value as number })}
          className="radius-slider"
        />
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        {showTitle && (
          <IonText color="primary">
            <h4>🔍 {t('filters.title')}</h4>
          </IonText>
        )}

        {/* Search Field */}
        <div className="filter-row">
          <IonLabel>{t('filters.search')}</IonLabel>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder="Search location, details, provider..."
            className="search-input"
            title="Search across all fields"
          />
        </div>

        <div className="filter-row">
          <IonLabel>{t('filters.availability.label')}</IonLabel>
          <select
            value={filters.availabilityFilter}
            onChange={(e) => onFiltersChange({ availabilityFilter: e.target.value })}
            className="filter-select"
            title="Filter by availability"
          >
            <option value="all">{t('filters.availability.all')}</option>
            <option value="available">{t('filters.availability.available')}</option>
            <option value="limited">{t('filters.availability.limited')}</option>
            <option value="unavailable">{t('filters.availability.unavailable')}</option>
          </select>
        </div>

        <div className="filter-row">
          <IonLabel>{t('filters.typeLabel')}</IonLabel>
          <select
            value={filters.typeFilter}
            onChange={(e) => onFiltersChange({ typeFilter: e.target.value })}
            className="filter-select"
            title="Filter by resource type"
          >
            <option value="all">{t('filters.types.all')}</option>
            <option value="food">{t('filters.types.food')}</option>
            <option value="medical">{t('filters.types.medical')}</option>
            <option value="shelter">{t('filters.types.shelter')}</option>
            <option value="water">{t('filters.types.water')}</option>
            <option value="supplies">{t('filters.types.supplies')}</option>
          </select>
        </div>

        <div className="filter-row">
          <IonLabel>{t('filters.myResourcesOnly')}</IonLabel>
          <input
            type="checkbox"
            checked={filters.myResourcesFilter}
            onChange={(e) => onFiltersChange({ myResourcesFilter: e.target.checked })}
            className="filter-checkbox"
            title="Show only my resources"
          />
        </div>

        <div className="filter-row">
          <IonLabel>{t('filters.sortBy' )}</IonLabel>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="filter-select"
            title="Sort resources by"
          >
            <option value="distance_km">{t('filters.sorting.distance','Distance')}</option>
            <option value="capacity">{t('filters.sorting.capacity','Capacity')}</option>
            <option value="availability">{t('filters.sorting.availability','Availability')}</option>
            <option value="timestamp">{t('filters.sorting.date','Date')}</option>
          </select>
          <IonLabel>{t('filters.order')}</IonLabel>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ sortOrder: e.target.value as any })}
            className="filter-select"
            title="Sort order"
          >
            <option value="asc">{t('filters.orderAsc','Ascending')}</option>
            <option value="desc">{t('filters.orderDesc','Descending')}</option>
          </select>
        </div>
      </div>

      {/* Current filter summary */}
      {(filters.availabilityFilter !== 'all' || filters.typeFilter !== 'all' || filters.myResourcesFilter) && (
        <div className="filter-summary">
          <IonText color="medium">
            <small>
              <strong>{t('reports.activeFilters')}</strong>
              {filters.myResourcesFilter && ` • ${t('filters.myResourcesOnly')}`}
              {filters.availabilityFilter !== 'all' && ` • ${t('filters.availability.label')}: ${getAvailabilityText(filters.availabilityFilter)}`}
              {filters.typeFilter !== 'all' && ` • ${t('filters.typeLabel')}: ${t(`filters.types.${filters.typeFilter}`) || filters.typeFilter}`}
            </small>
          </IonText>
        </div>
      )}
    </div>
  );
};

export default ResourceFilters;

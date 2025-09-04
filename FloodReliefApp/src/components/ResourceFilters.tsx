import React from 'react';
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
  return (
    <div className={compact ? 'filters-compact' : ''}>
      {/* Radius Control */}
      <div className="radius-control">
        <IonLabel>
          <small>Search Radius: {filters.searchRadius} km</small>
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
            <h4>🔍 Filters & Search</h4>
          </IonText>
        )}

        {/* Search Field */}
        <div className="filter-row">
          <IonLabel>Search:</IonLabel>
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
          <IonLabel>Availability:</IonLabel>
          <select
            value={filters.availabilityFilter}
            onChange={(e) => onFiltersChange({ availabilityFilter: e.target.value })}
            className="filter-select"
            title="Filter by availability"
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <div className="filter-row">
          <IonLabel>Type:</IonLabel>
          <select
            value={filters.typeFilter}
            onChange={(e) => onFiltersChange({ typeFilter: e.target.value })}
            className="filter-select"
            title="Filter by resource type"
          >
            <option value="all">All Types</option>
            <option value="food">Food</option>
            <option value="medical">Medical</option>
            <option value="shelter">Shelter</option>
            <option value="water">Water</option>
            <option value="supplies">Supplies</option>
          </select>
        </div>

        <div className="filter-row">
          <IonLabel>My Resources:</IonLabel>
          <input
            type="checkbox"
            checked={filters.myResourcesFilter}
            onChange={(e) => onFiltersChange({ myResourcesFilter: e.target.checked })}
            className="filter-checkbox"
            title="Show only my resources"
          />
        </div>

        <div className="filter-row">
          <IonLabel>Sort by:</IonLabel>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="filter-select"
            title="Sort resources by"
          >
            <option value="distance_km">Distance</option>
            <option value="capacity">Capacity</option>
            <option value="availability">Availability</option>
            <option value="timestamp">Date</option>
          </select>
          <IonLabel>Order:</IonLabel>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ sortOrder: e.target.value as any })}
            className="filter-select"
            title="Sort order"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Current filter summary */}
      {(filters.availabilityFilter !== 'all' || filters.typeFilter !== 'all' || filters.myResourcesFilter) && (
        <div className="filter-summary">
          <IonText color="medium">
            <small>
              <strong>Active Filters:</strong>
              {filters.myResourcesFilter && ' My Resources'}
              {filters.availabilityFilter !== 'all' && ` • Availability: ${getAvailabilityText(filters.availabilityFilter)}`}
              {filters.typeFilter !== 'all' && ` • Type: ${filters.typeFilter}`}
            </small>
          </IonText>
        </div>
      )}
    </div>
  );
};

export default ResourceFilters;

export interface Comment {
  id: number;
  comment: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ReliefResource {
  id: number;
  location: string;
  address?: string;
  contact?: string;
  contact_phone?: string;
  resource_type?: string;
  details: string;
  capacity?: number;
  availability: string;
  distance_km?: number;
  timestamp: Date;
  lat: number;
  lng: number;
  photos?: string[];
  videos?: string[];
  user_id?: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  comments?: Comment[];
}

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';
export type ResourceType = 'food' | 'medical' | 'shelter' | 'water' | 'supplies';
export type SortField = 'distance_km' | 'capacity' | 'availability' | 'timestamp';
export type SortOrder = 'asc' | 'desc';

export interface ResourceFilters {
  searchRadius: number;
  availabilityFilter: string;
  typeFilter: string;
  myResourcesFilter: boolean;
  searchTerm: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface MapLayer {
  satellite: L.TileLayer;
  streets: L.TileLayer;
  terrain: L.TileLayer;
  topo: L.TileLayer;
}

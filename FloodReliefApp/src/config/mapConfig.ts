import { MapLayerConfig, MapProviderConfig } from '../providers/map/mapTypes';

// Default layer configurations
export const DEFAULT_MAP_LAYERS: MapLayerConfig = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
    maxZoom: 13
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17
  }
};

// Default layer key
export const DEFAULT_MAP_LAYER = 'satellite';

// Map provider configuration
export const MAP_PROVIDER_CONFIG: MapProviderConfig = {
  defaultProvider: 'leaflet',
  providers: {
    leaflet: {
      enabled: true,
      priority: 1,
      config: {
        // Leaflet-specific configuration
        preferCanvas: false,
        attributionControl: true,
        zoomControl: true
      }
    },
    // Future providers can be added here
    // google: {
    //   enabled: false,
    //   priority: 2,
    //   config: {
    //     apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY
    //   }
    // },
    // mapbox: {
    //   enabled: false,
    //   priority: 3,
    //   config: {
    //     accessToken: process.env.VITE_MAPBOX_ACCESS_TOKEN
    //   }
    // }
  },
  fallback: {
    enabled: true,
    provider: 'leaflet'
  }
};

// Environment-based provider selection
export function getPreferredProvider(): string {
  // Could be based on environment variables, feature flags, etc.
  const envProvider = import.meta.env.VITE_MAP_PROVIDER;
  if (envProvider && MAP_PROVIDER_CONFIG.providers[envProvider]?.enabled) {
    return envProvider;
  }
  return MAP_PROVIDER_CONFIG.defaultProvider;
}

// Layer preference utilities (keeping compatibility with existing code)
export const getMapLayerPreference = (): string => {
  const saved = localStorage.getItem('preferred_map_layer');
  if (saved && saved in DEFAULT_MAP_LAYERS) {
    return saved;
  }
  return DEFAULT_MAP_LAYER;
};

export const saveMapLayerPreference = (layer: string): void => {
  if (layer in DEFAULT_MAP_LAYERS) {
    localStorage.setItem('preferred_map_layer', layer);
  }
};

// Map configuration presets for different use cases
export const MAP_PRESETS = {
  // For viewing multiple markers (requests/resources)
  display: {
    initialZoom: 13,
    minZoom: 3,
    maxZoom: 19,
    attributionControl: true,
    zoomControl: true
  },
  
  // For form input (single draggable marker)
  form: {
    initialZoom: 16,
    minZoom: 10,
    maxZoom: 19,
    attributionControl: true,
    zoomControl: true
  },
  
  // For overview/landing page
  overview: {
    initialZoom: 10,
    minZoom: 3,
    maxZoom: 17,
    attributionControl: false,
    zoomControl: false
  }
};

export type MapPresetKey = keyof typeof MAP_PRESETS;

// Icon generation helpers (for backward compatibility)
export function generateRequestTypeIcon(requestType?: string): string {
  switch (requestType?.toLowerCase()) {
    case 'medical':
      return `<path d="M8 2c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V2z"/><path d="M2 8c-1.1 0-2 .9-2 2s.9 2 2 2h6c1.1 0 2-.9 2-2s-.9-2-2-2H2z"/>`;
    case 'food':
      return `<path d="M4 2c0-1.1.9-2 2-2v8c-1.1 0-2-.9-2-2V2z"/><path d="M8 2c0-1.1.9-2 2-2v8c-1.1 0-2-.9-2-2V2z"/><path d="M12 2c0-1.1.9-2 2-2s2 .9 2 2v2c0 1.1-.9 2-2 2v8h-2V6c-1.1 0-2-.9-2-2V2z"/>`;
    case 'shelter':
      return `<path d="M2 12h16l-8-10z"/><path d="M6 12v6h3v-4h2v4h3v-6"/>`;
    case 'water':
      return `<path d="M8 4c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.4-1 1.7v2.3h2v2h-6v-2h2v-2.3c-.6-.3-1-1-1-1.7z"/><path d="M12 12h-2v-2h2z"/>`;
    case 'supplies':
      return `<path d="M6 6h8v8h-8z"/><path d="M8 8h4v4h-4z"/>`;
    default:
      return `<circle cx="10" cy="10" r="3"/>`;
  }
}

export function generateResourceTypeIcon(resourceType?: string): string {
  switch (resourceType?.toLowerCase()) {
    case 'shelter':
      return `<path d="M2 12h16l-8-10z"/><path d="M6 12v6h3v-4h2v4h3v-6"/>`;
    case 'medical':
      return `<path d="M8 2c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V2z"/><path d="M2 8c-1.1 0-2 .9-2 2s.9 2 2 2h6c1.1 0 2-.9 2-2s-.9-2-2-2H2z"/>`;
    case 'food':
      return `<path d="M4 2c0-1.1.9-2 2-2v8c-1.1 0-2-.9-2-2V2z"/><path d="M8 2c0-1.1.9-2 2-2v8c-1.1 0-2-.9-2-2V2z"/><path d="M12 2c0-1.1.9-2 2-2s2 .9 2 2v2c0 1.1-.9 2-2 2v8h-2V6c-1.1 0-2-.9-2-2V2z"/>`;
    case 'water':
      return `<path d="M8 4c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.4-1 1.7v2.3h2v2h-6v-2h2v-2.3c-.6-.3-1-1-1-1.7z"/><path d="M12 12h-2v-2h2z"/>`;
    case 'supplies':
      return `<path d="M6 6h8v8h-8z"/><path d="M8 8h4v4h-4z"/>`;
    case 'transportation':
      return `<path d="M3 6h14l-2-4H5z"/><path d="M2 8v8h2v-2h12v2h2V8H2z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="12" r="2"/>`;
    default:
      return `<circle cx="10" cy="10" r="3"/>`;
  }
}

export function getRequestTypeColor(requestType?: string): string {
  switch (requestType?.toLowerCase()) {
    case 'medical': return '#eb445a'; // red
    case 'food': return '#ffc409';    // yellow
    case 'shelter': return '#3880ff'; // blue
    case 'water': return '#5260ff';   // indigo
    case 'supplies': return '#3dc2ff'; // light blue
    default: return '#92949c';         // gray
  }
}

export function getResourceTypeColor(resourceType?: string): string {
  switch (resourceType?.toLowerCase()) {
    case 'shelter': return '#3880ff';  // blue
    case 'medical': return '#eb445a';  // red
    case 'food': return '#ffc409';     // yellow
    case 'water': return '#5260ff';    // indigo
    case 'supplies': return '#3dc2ff'; // light blue
    case 'transportation': return '#10dc60'; // green
    default: return '#92949c';          // gray
  }
}

export function getAvailabilityColor(availability?: string): string {
  switch (availability?.toLowerCase()) {
    case 'available': return '#10dc60';   // green
    case 'limited': return '#ffc409';     // yellow
    case 'unavailable': return '#eb445a'; // red
    default: return '#92949c';             // gray
  }
}

export function getResourceAvailabilityColor(availability?: string): string {
  return getAvailabilityColor(availability);
}

export function generateResourceIconDataUrl(resource: any): string {
  const color = getResourceAvailabilityColor(resource.availability || 'available');
  const iconPath = generateResourceTypeIcon(resource.resource_type);
  
  const svg = `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    <g transform="translate(5,5) scale(0.5)" fill="white">
      ${iconPath}
    </g>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateUserLocationIconDataUrl(): string {
  const svg = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#3880ff" stroke="white" stroke-width="3"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateExploreLocationIconDataUrl(): string {
  const svg = `<svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12.5" cy="12.5" r="11" fill="#ffc409" stroke="white" stroke-width="3"/>
    <circle cx="12.5" cy="12.5" r="4" fill="white"/>
    <path d="M12.5 6.5L14.5 10.5L12.5 8.5L10.5 10.5Z" fill="#ffc409"/>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

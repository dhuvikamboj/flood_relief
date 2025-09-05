import L from 'leaflet';

export const MAP_LAYERS = {
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }),
  streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }),
  terrain: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS'
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  })
} as const;

export type MapLayerKey = keyof typeof MAP_LAYERS;

// Default layer preference
export const DEFAULT_MAP_LAYER: MapLayerKey = 'satellite';

// Utility function to get layer preference with fallback
export const getMapLayerPreference = (): MapLayerKey => {
  const saved = localStorage.getItem('preferred_map_layer') as MapLayerKey;
  // Ensure the saved preference is a valid layer key
  if (saved && saved in MAP_LAYERS) {
    return saved;
  }
  return DEFAULT_MAP_LAYER;
};

// Utility function to save layer preference
export const saveMapLayerPreference = (layer: MapLayerKey): void => {
  localStorage.setItem('preferred_map_layer', layer);
};

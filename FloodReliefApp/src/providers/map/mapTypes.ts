// Common types and interfaces for map providers

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  northEast: MapCoordinates;
  southWest: MapCoordinates;
}

export interface MapTileLayer {
  url: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
  options?: Record<string, any>;
}

export interface MapLayerConfig {
  [key: string]: MapTileLayer;
}

export interface MapMarkerIcon {
  url?: string;
  size: [number, number];
  anchor: [number, number];
  popupAnchor?: [number, number];
  shadowUrl?: string;
  shadowSize?: [number, number];
  className?: string;
}

export interface MapMarkerOptions {
  icon?: MapMarkerIcon;
  draggable?: boolean;
  title?: string;
  opacity?: number;
  zIndexOffset?: number;
  riseOnHover?: boolean;
}

export interface MapMarker {
  id: string;
  coordinates: MapCoordinates;
  options?: MapMarkerOptions;
  popupContent?: string;
  data?: any; // Custom data attached to marker
}

export interface MapPopupOptions {
  maxWidth?: number;
  minWidth?: number;
  autoClose?: boolean;
  closeOnClick?: boolean;
  className?: string;
}

export interface MapEventHandlers {
  onMapClick?: (coords: MapCoordinates) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
  onMapZoomStart?: () => void;
  onMapZoomEnd?: (zoom: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onMarkerDragStart?: (marker: MapMarker) => void;
  onMarkerDragEnd?: (marker: MapMarker, newCoords: MapCoordinates) => void;
}

export interface MapViewOptions {
  center: MapCoordinates;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: MapBounds;
  attributionControl?: boolean;
  zoomControl?: boolean;
}

export interface MapConfiguration {
  container: HTMLElement;
  initialView: MapViewOptions;
  layers: MapLayerConfig;
  defaultLayer: string;
  eventHandlers?: MapEventHandlers;
}

export type MapLayerKey = string;

export interface MapInstance {
  // Core map methods
  setView(center: MapCoordinates, zoom: number): void;
  getCenter(): MapCoordinates;
  getZoom(): number;
  getBounds(): MapBounds;
  invalidateSize(): void;
  remove(): void;

  // Layer management
  addLayer(layerKey: string): void;
  removeLayer(layerKey: string): void;
  setActiveLayer(layerKey: string): void;
  getActiveLayer(): string;
  hasLayer(layerKey: string): boolean;

  // Marker management
  addMarker(marker: MapMarker): string; // Returns marker ID
  removeMarker(markerId: string): void;
  updateMarker(markerId: string, coordinates: MapCoordinates): void;
  getMarker(markerId: string): MapMarker | null;
  clearMarkers(): void;
  getAllMarkers(): MapMarker[];

  // Popup management
  openPopup(content: string, coordinates: MapCoordinates, options?: MapPopupOptions): void;
  closePopup(): void;
  bindPopupToMarker(markerId: string, content: string, options?: MapPopupOptions): void;

  // Event handling
  on(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;

  // Utility methods
  latLngToLayerPoint(coords: MapCoordinates): { x: number; y: number };
  layerPointToLatLng(point: { x: number; y: number }): MapCoordinates;
  getContainer(): HTMLElement;
}

// Provider factory interface
export interface IMapProvider {
  readonly name: string;
  readonly version: string;
  
  // Initialization
  initialize(config: MapConfiguration): Promise<MapInstance>;
  isSupported(): boolean;
  
  // Icon generation helpers
  createCustomIcon(options: MapMarkerIcon): any; // Provider-specific icon object
  createSVGIcon(svg: string, color: string, size: [number, number]): any;
  
  // Layer creation helpers
  createTileLayer(config: MapTileLayer): any; // Provider-specific layer object
  
  // Cleanup
  cleanup(): void;
}

// Map provider factory result
export interface MapProviderResult {
  provider: IMapProvider;
  instance: MapInstance;
}

// Error types
export class MapProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'MapProviderError';
  }
}

export class MapInitializationError extends MapProviderError {
  constructor(provider: string, originalError?: Error) {
    super(
      `Failed to initialize map provider: ${provider}${originalError ? ` (${originalError.message})` : ''}`,
      provider,
      'INIT_FAILED'
    );
  }
}

// Provider configuration
export interface MapProviderConfig {
  defaultProvider: string;
  providers: {
    [key: string]: {
      enabled: boolean;
      priority: number;
      config?: Record<string, any>;
    };
  };
  fallback: {
    enabled: boolean;
    provider?: string;
  };
}

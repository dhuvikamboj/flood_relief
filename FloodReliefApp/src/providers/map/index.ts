// Map Provider Abstraction Layer
// This module provides a clean abstraction for different map providers

export * from './mapTypes';
export * from './MapProviderFactory';
export { default as LeafletMapProvider } from './LeafletMapProvider';

// Re-export factory convenience functions
export { createMap, getSupportedProviders, mapProviderFactory } from './MapProviderFactory';

// Helper function to create a map configuration
import { 
  MapConfiguration, 
  MapViewOptions, 
  MapEventHandlers, 
  MapCoordinates 
} from './mapTypes';
import { DEFAULT_MAP_LAYERS, getMapLayerPreference } from '../../config/mapConfig';

export function createMapConfiguration(
  container: HTMLElement,
  center: MapCoordinates,
  zoom: number = 13,
  eventHandlers?: MapEventHandlers,
  options?: Partial<MapViewOptions>
): MapConfiguration {
  return {
    container,
    initialView: {
      center,
      zoom,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: true,
      zoomControl: true,
      ...options
    },
    layers: DEFAULT_MAP_LAYERS,
    defaultLayer: getMapLayerPreference(),
    eventHandlers
  };
}

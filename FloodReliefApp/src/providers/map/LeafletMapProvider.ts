import L from 'leaflet';
import {
  IMapProvider,
  MapInstance,
  MapConfiguration,
  MapCoordinates,
  MapBounds,
  MapMarker,
  MapMarkerIcon,
  MapMarkerOptions,
  MapPopupOptions,
  MapEventHandlers,
  MapTileLayer,
  MapInitializationError,
  MapProviderError
} from './mapTypes';

// Leaflet-specific map instance implementation
class LeafletMapInstance implements MapInstance {
  private map: L.Map;
  private markers = new Map<string, L.Marker>();
  private layers = new Map<string, L.TileLayer>();
  private activeLayerKey: string;
  private eventHandlers: MapEventHandlers;

  constructor(
    map: L.Map,
    layers: Map<string, L.TileLayer>,
    activeLayerKey: string,
    eventHandlers: MapEventHandlers = {}
  ) {
    this.map = map;
    this.layers = layers;
    this.activeLayerKey = activeLayerKey;
    this.eventHandlers = eventHandlers;
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (this.eventHandlers.onMapClick) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.eventHandlers.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    if (this.eventHandlers.onMapDragStart) {
      this.map.on('dragstart', () => this.eventHandlers.onMapDragStart?.());
    }

    if (this.eventHandlers.onMapDragEnd) {
      this.map.on('dragend', () => this.eventHandlers.onMapDragEnd?.());
    }

    if (this.eventHandlers.onMapZoomStart) {
      this.map.on('zoomstart', () => this.eventHandlers.onMapZoomStart?.());
    }

    if (this.eventHandlers.onMapZoomEnd) {
      this.map.on('zoomend', () => {
        this.eventHandlers.onMapZoomEnd?.(this.map.getZoom());
      });
    }
  }

  // Core map methods
  setView(center: MapCoordinates, zoom: number): void {
    this.map.setView([center.lat, center.lng], zoom);
  }

  getCenter(): MapCoordinates {
    const center = this.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  getZoom(): number {
    return this.map.getZoom();
  }

  getBounds(): MapBounds {
    const bounds = this.map.getBounds();
    return {
      northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng }
    };
  }

  invalidateSize(): void {
    this.map.invalidateSize();
  }

  remove(): void {
    try {
      // Clean up event handlers
      this.map.off();
      
      // Remove all markers
      this.clearMarkers();
      
      // Remove all layers
      this.layers.forEach(layer => {
        if (this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      });
      
      // Remove the map
      this.map.remove();
    } catch (error) {
      console.warn('Error during map cleanup:', error);
    }
  }

  // Layer management
  addLayer(layerKey: string): void {
    const layer = this.layers.get(layerKey);
    if (layer && !this.map.hasLayer(layer)) {
      layer.addTo(this.map);
    }
  }

  removeLayer(layerKey: string): void {
    const layer = this.layers.get(layerKey);
    if (layer && this.map.hasLayer(layer)) {
      this.map.removeLayer(layer);
    }
  }

  setActiveLayer(layerKey: string): void {
    // Remove current active layer
    if (this.activeLayerKey) {
      this.removeLayer(this.activeLayerKey);
    }
    
    // Add new active layer
    this.addLayer(layerKey);
    this.activeLayerKey = layerKey;
  }

  getActiveLayer(): string {
    return this.activeLayerKey;
  }

  hasLayer(layerKey: string): boolean {
    const layer = this.layers.get(layerKey);
    return layer ? this.map.hasLayer(layer) : false;
  }

  // Marker management
  addMarker(marker: MapMarker): string {
    const leafletMarker = L.marker([marker.coordinates.lat, marker.coordinates.lng], {
      draggable: marker.options?.draggable,
      title: marker.options?.title,
      opacity: marker.options?.opacity,
      zIndexOffset: marker.options?.zIndexOffset,
      riseOnHover: marker.options?.riseOnHover,
      icon: marker.options?.icon ? this.convertIconToLeaflet(marker.options.icon) : undefined
    });

    // Add popup if provided
    if (marker.popupContent) {
      leafletMarker.bindPopup(marker.popupContent);
    }

    // Setup marker event handlers
    if (this.eventHandlers.onMarkerClick) {
      leafletMarker.on('click', () => {
        this.eventHandlers.onMarkerClick?.(marker);
      });
    }

    if (this.eventHandlers.onMarkerDragStart) {
      leafletMarker.on('dragstart', () => {
        this.eventHandlers.onMarkerDragStart?.(marker);
      });
    }

    if (this.eventHandlers.onMarkerDragEnd) {
      leafletMarker.on('dragend', (e: L.DragEndEvent) => {
        const newCoords = { lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng };
        this.eventHandlers.onMarkerDragEnd?.(marker, newCoords);
      });
    }

    leafletMarker.addTo(this.map);
    this.markers.set(marker.id, leafletMarker);
    
    return marker.id;
  }

  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      try {
        if (this.map.hasLayer(marker)) {
          this.map.removeLayer(marker);
        }
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
      this.markers.delete(markerId);
    }
  }

  updateMarker(markerId: string, coordinates: MapCoordinates): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.setLatLng([coordinates.lat, coordinates.lng]);
    }
  }

  getMarker(markerId: string): MapMarker | null {
    const leafletMarker = this.markers.get(markerId);
    if (!leafletMarker) return null;

    const latlng = leafletMarker.getLatLng();
    return {
      id: markerId,
      coordinates: { lat: latlng.lat, lng: latlng.lng },
      options: {
        draggable: leafletMarker.options.draggable,
        title: leafletMarker.options.title,
        opacity: leafletMarker.options.opacity
      }
    };
  }

  clearMarkers(): void {
    this.markers.forEach((marker, id) => {
      this.removeMarker(id);
    });
  }

  getAllMarkers(): MapMarker[] {
    const markers: MapMarker[] = [];
    this.markers.forEach((leafletMarker, id) => {
      const latlng = leafletMarker.getLatLng();
      markers.push({
        id,
        coordinates: { lat: latlng.lat, lng: latlng.lng },
        options: {
          draggable: leafletMarker.options.draggable,
          title: leafletMarker.options.title,
          opacity: leafletMarker.options.opacity
        }
      });
    });
    return markers;
  }

  // Popup management
  openPopup(content: string, coordinates: MapCoordinates, options?: MapPopupOptions): void {
    const popup = L.popup({
      maxWidth: options?.maxWidth,
      minWidth: options?.minWidth,
      autoClose: options?.autoClose,
      closeOnClick: options?.closeOnClick,
      className: options?.className
    })
      .setLatLng([coordinates.lat, coordinates.lng])
      .setContent(content)
      .openOn(this.map);
  }

  closePopup(): void {
    this.map.closePopup();
  }

  bindPopupToMarker(markerId: string, content: string, options?: MapPopupOptions): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.bindPopup(content, {
        maxWidth: options?.maxWidth,
        minWidth: options?.minWidth,
        autoClose: options?.autoClose,
        closeOnClick: options?.closeOnClick,
        className: options?.className
      });
    }
  }

  // Event handling
  on(event: string, handler: Function): void {
    this.map.on(event as any, handler as any);
  }

  off(event: string, handler?: Function): void {
    this.map.off(event as any, handler as any);
  }

  // Utility methods
  latLngToLayerPoint(coords: MapCoordinates): { x: number; y: number } {
    const point = this.map.latLngToLayerPoint([coords.lat, coords.lng]);
    return { x: point.x, y: point.y };
  }

  layerPointToLatLng(point: { x: number; y: number }): MapCoordinates {
    const latlng = this.map.layerPointToLatLng([point.x, point.y]);
    return { lat: latlng.lat, lng: latlng.lng };
  }

  getContainer(): HTMLElement {
    return this.map.getContainer();
  }

  // Helper methods
  private convertIconToLeaflet(icon: MapMarkerIcon): L.Icon {
    if (!icon.url) {
      throw new Error('Icon URL is required');
    }

    const iconOptions: L.IconOptions = {
      iconUrl: icon.url,
      iconSize: icon.size,
      iconAnchor: icon.anchor
    };

    if (icon.popupAnchor) iconOptions.popupAnchor = icon.popupAnchor;
    if (icon.shadowUrl) iconOptions.shadowUrl = icon.shadowUrl;
    if (icon.shadowSize) iconOptions.shadowSize = icon.shadowSize;
    if (icon.className) iconOptions.className = icon.className;

    return new L.Icon(iconOptions);
  }
}

// Leaflet provider implementation
export class LeafletMapProvider implements IMapProvider {
  readonly name = 'leaflet';
  readonly version = '1.9.4';

  async initialize(config: MapConfiguration): Promise<MapInstance> {
    try {
      // Ensure Leaflet is available
      if (typeof L === 'undefined') {
        throw new Error('Leaflet library is not available');
      }

      // Fix default marker icons for bundlers
      this.fixDefaultIcons();

      // Create the map
      const map = L.map(config.container, {
        attributionControl: config.initialView.attributionControl !== false,
        zoomControl: config.initialView.zoomControl !== false,
        minZoom: config.initialView.minZoom,
        maxZoom: config.initialView.maxZoom
      }).setView(
        [config.initialView.center.lat, config.initialView.center.lng],
        config.initialView.zoom
      );

      // Set max bounds if provided
      if (config.initialView.maxBounds) {
        const bounds = L.latLngBounds(
          [config.initialView.maxBounds.southWest.lat, config.initialView.maxBounds.southWest.lng],
          [config.initialView.maxBounds.northEast.lat, config.initialView.maxBounds.northEast.lng]
        );
        map.setMaxBounds(bounds);
      }

      // Create tile layers
      const layers = new Map<string, L.TileLayer>();
      Object.entries(config.layers).forEach(([key, layerConfig]) => {
        const layer = this.createTileLayer(layerConfig);
        layers.set(key, layer);
      });

      // Add default layer
      const defaultLayer = layers.get(config.defaultLayer);
      if (defaultLayer) {
        defaultLayer.addTo(map);
      } else {
        throw new Error(`Default layer '${config.defaultLayer}' not found`);
      }

      return new LeafletMapInstance(map, layers, config.defaultLayer, config.eventHandlers);
    } catch (error) {
      throw new MapInitializationError(this.name, error as Error);
    }
  }

  isSupported(): boolean {
    return typeof L !== 'undefined' && typeof window !== 'undefined';
  }

  createCustomIcon(options: MapMarkerIcon): L.Icon {
    if (!options.url) {
      throw new Error('Icon URL is required for custom icons');
    }

    const iconOptions: L.IconOptions = {
      iconUrl: options.url,
      iconSize: options.size,
      iconAnchor: options.anchor
    };

    if (options.popupAnchor) iconOptions.popupAnchor = options.popupAnchor;
    if (options.shadowUrl) iconOptions.shadowUrl = options.shadowUrl;
    if (options.shadowSize) iconOptions.shadowSize = options.shadowSize;
    if (options.className) iconOptions.className = options.className;

    return new L.Icon(iconOptions);
  }

  createSVGIcon(svg: string, color: string, size: [number, number]): L.Icon {
    const iconUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size[0]/2}" cy="${size[1]/2}" r="${Math.min(size[0], size[1])/2 - 1}" fill="${color}" stroke="#fff" stroke-width="1"/>
        <g fill="#fff" transform="translate(0, 0)">
          ${svg}
        </g>
      </svg>
    `)}`;

    return new L.Icon({
      iconUrl,
      iconSize: size,
      iconAnchor: [size[0]/2, size[1]/2],
      popupAnchor: [0, -size[1]/2],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: size
    });
  }

  createTileLayer(config: MapTileLayer): L.TileLayer {
    return L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      minZoom: config.minZoom,
      ...config.options
    });
  }

  cleanup(): void {
    // Cleanup any global Leaflet resources if needed
  }

  private fixDefaultIcons(): void {
    try {
      // Fix for default markers in bundled environments
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    } catch (error) {
      console.warn('Could not fix Leaflet default icons:', error);
    }
  }
}

export default LeafletMapProvider;

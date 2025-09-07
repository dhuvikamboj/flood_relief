# 🗺️ Map Provider Integration Guide

This guide explains how to add a new map provider to the Flood Relief Platform. The platform uses a provider abstraction system that allows seamless switching between different mapping services.

## 📋 Overview

The map system is built with a provider-agnostic architecture that separates the map interface from the underlying implementation. This allows the platform to:

- Switch between different map providers (Google Maps, Mapbox, Leaflet, etc.)
- Maintain consistent functionality across all providers
- Add new providers without breaking existing code
- Fallback to alternative providers if one fails

## 🏗️ Architecture Overview

```
src/providers/map/
├── mapTypes.ts              # Core interfaces and types
├── IMapProvider.ts          # Main provider interface
├── LeafletMapProvider.ts    # Current Leaflet implementation
├── MapProviderFactory.ts    # Provider factory and registry
└── index.ts                 # Public API exports
```

### Key Components

1. **IMapProvider Interface**: Defines the contract all providers must implement
2. **MapProviderFactory**: Manages provider registration and instantiation
3. **MapInstance**: Represents an active map with standardized methods
4. **Provider Implementations**: Concrete implementations for each mapping service

## 🛠️ Adding a New Map Provider

### Step 1: Implement the IMapProvider Interface

Create a new file `src/providers/map/YourMapProvider.ts`:

```typescript
import { 
  IMapProvider, 
  MapInstance, 
  MapConfiguration, 
  MapProviderResult,
  MapCoordinates,
  MapMarker,
  MapEventHandlers 
} from './mapTypes';

export class YourMapProvider implements IMapProvider {
  readonly name = 'yourmap';
  readonly displayName = 'Your Map Service';
  readonly version = '1.0.0';

  async isAvailable(): Promise<boolean> {
    // Check if the map service is available
    // Example: Check if SDK is loaded, API key is valid, etc.
    return typeof window !== 'undefined' && 
           'YourMapSDK' in window && 
           !!window.YourMapSDK;
  }

  async createMap(
    container: HTMLElement, 
    config: MapConfiguration,
    eventHandlers?: Partial<MapEventHandlers>
  ): Promise<MapProviderResult> {
    try {
      // Initialize your map instance
      const mapInstance = new YourMapInstance(container, config, eventHandlers);
      await mapInstance.initialize();
      
      return {
        success: true,
        mapInstance,
        provider: this
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create map',
        provider: this
      };
    }
  }

  cleanup(): void {
    // Perform any necessary cleanup
    // Example: Remove event listeners, clear caches, etc.
  }
}
```

### Step 2: Implement the MapInstance Class

Create the MapInstance implementation within the same file:

```typescript
import { 
  MapInstance, 
  MapConfiguration, 
  MapCoordinates, 
  MapMarker, 
  MapEventHandlers 
} from './mapTypes';

class YourMapInstance implements MapInstance {
  private map: any; // Your map SDK instance
  private markers: Map<string, any> = new Map();
  private eventHandlers: Partial<MapEventHandlers>;

  constructor(
    private container: HTMLElement,
    private config: MapConfiguration,
    eventHandlers?: Partial<MapEventHandlers>
  ) {
    this.eventHandlers = eventHandlers || {};
  }

  async initialize(): Promise<void> {
    // Initialize the map with your SDK
    this.map = new window.YourMapSDK.Map(this.container, {
      center: [this.config.center.lat, this.config.center.lng],
      zoom: this.config.zoom,
      // ... other configuration options
    });

    // Set up event listeners
    this.setupEventHandlers();
    
    // Set initial layer
    if (this.config.initialLayer) {
      this.setActiveLayer(this.config.initialLayer);
    }
  }

  addMarker(marker: MapMarker): string {
    // Create marker with your SDK
    const mapMarker = new window.YourMapSDK.Marker({
      position: [marker.coordinates.lat, marker.coordinates.lng],
      // ... configure marker appearance
    });

    // Add popup if content provided
    if (marker.popupContent) {
      const popup = new window.YourMapSDK.Popup()
        .setHTML(marker.popupContent);
      mapMarker.setPopup(popup);
    }

    // Add to map
    mapMarker.addTo(this.map);
    
    // Store reference
    this.markers.set(marker.id, mapMarker);
    
    return marker.id;
  }

  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.remove();
      this.markers.delete(markerId);
    }
  }

  updateMarker(markerId: string, coordinates: MapCoordinates): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.setLatLng([coordinates.lat, coordinates.lng]);
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
  }

  setView(center: MapCoordinates, zoom?: number): void {
    this.map.setView([center.lat, center.lng], zoom || this.map.getZoom());
  }

  getCenter(): MapCoordinates {
    const center = this.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  getZoom(): number {
    return this.map.getZoom();
  }

  setActiveLayer(layerName: string): void {
    // Implement layer switching logic
    // Example:
    switch (layerName) {
      case 'satellite':
        this.map.setMapTypeId('satellite');
        break;
      case 'streets':
        this.map.setMapTypeId('roadmap');
        break;
      // ... other layers
    }
  }

  invalidateSize(): void {
    // Trigger map resize/refresh
    if (this.map.invalidateSize) {
      this.map.invalidateSize();
    }
  }

  remove(): void {
    // Clean up the map instance
    this.clearMarkers();
    if (this.map.remove) {
      this.map.remove();
    }
  }

  private setupEventHandlers(): void {
    // Set up map event listeners
    if (this.eventHandlers.onMapClick) {
      this.map.on('click', (e: any) => {
        this.eventHandlers.onMapClick!({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    }

    if (this.eventHandlers.onMapZoomEnd) {
      this.map.on('zoomend', () => {
        this.eventHandlers.onMapZoomEnd!(this.getZoom());
      });
    }

    // ... implement other event handlers
  }
}
```

### Step 3: Register the Provider

Update `src/providers/map/MapProviderFactory.ts`:

```typescript
import { YourMapProvider } from './YourMapProvider';

// Add to the provider registration
export function createMapProviderFactory(): MapProviderFactory {
  const factory = new MapProviderFactory();
  
  // Register existing providers
  factory.registerProvider(new LeafletMapProvider());
  
  // Register your new provider
  factory.registerProvider(new YourMapProvider());
  
  return factory;
}
```

### Step 4: Update the Factory Index

Update `src/providers/map/index.ts`:

```typescript
// Export your new provider
export { YourMapProvider } from './YourMapProvider';

// Update the createMap function to include your provider
export async function createMap(
  container: HTMLElement,
  config: MapConfiguration,
  preferredProvider?: string,
  eventHandlers?: Partial<MapEventHandlers>
): Promise<MapProviderResult> {
  const factory = createMapProviderFactory();
  
  // Add your provider to the priority list
  const providers = preferredProvider 
    ? [preferredProvider, 'leaflet', 'yourmap'] 
    : ['leaflet', 'yourmap']; // Add your provider as fallback
    
  return factory.createMap(container, config, providers, eventHandlers);
}
```

## 🔧 Configuration Examples

### Provider-Specific Configuration

Add configuration options in `src/config/mapConfig.ts`:

```typescript
export interface YourMapConfig {
  apiKey?: string;
  theme?: 'light' | 'dark';
  customStyles?: any[];
}

export const YOUR_MAP_CONFIG: YourMapConfig = {
  apiKey: process.env.REACT_APP_YOURMAP_API_KEY,
  theme: 'light',
};

// Update map presets to include your provider
export const MAP_PRESETS = {
  display: {
    zoom: 12,
    interactive: true,
    preferredProvider: 'yourmap', // Use your provider by default
  },
  // ... other presets
};
```

### Environment Variables

Add to `.env` file:

```env
REACT_APP_YOURMAP_API_KEY=your_api_key_here
REACT_APP_YOURMAP_ENABLED=true
```

## 📚 SDK Integration

### Loading External Scripts

If your map provider requires external scripts, add them to `public/index.html`:

```html
<head>
  <!-- Your Map Provider SDK -->
  <script async defer
    src="https://api.yourmap.com/sdk/v1/yourmap.js?key=YOUR_API_KEY">
  </script>
</head>
```

### Dynamic Loading

For dynamic loading, create a utility function:

```typescript
// src/utils/mapLoader.ts
export async function loadYourMapSDK(): Promise<void> {
  if (window.YourMapSDK) {
    return; // Already loaded
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api.yourmap.com/sdk/v1/yourmap.js?key=${YOUR_MAP_CONFIG.apiKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load YourMap SDK'));
    
    document.head.appendChild(script);
  });
}
```

## 🧪 Testing Your Provider

### Unit Tests

Create tests in `src/providers/map/__tests__/YourMapProvider.test.ts`:

```typescript
import { YourMapProvider } from '../YourMapProvider';
import { MapConfiguration } from '../mapTypes';

describe('YourMapProvider', () => {
  let provider: YourMapProvider;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    provider = new YourMapProvider();
    mockContainer = document.createElement('div');
    
    // Mock the SDK
    (global as any).window = {
      YourMapSDK: {
        Map: jest.fn(),
        Marker: jest.fn(),
        Popup: jest.fn(),
      }
    };
  });

  test('should be available when SDK is loaded', async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });

  test('should create map instance successfully', async () => {
    const config: MapConfiguration = {
      center: { lat: 0, lng: 0 },
      zoom: 10,
      initialLayer: 'streets'
    };

    const result = await provider.createMap(mockContainer, config);
    
    expect(result.success).toBe(true);
    expect(result.mapInstance).toBeDefined();
  });

  // ... more tests
});
```

### Integration Tests

Test the provider with the actual hook:

```typescript
// src/hooks/__tests__/useMap.yourmap.test.tsx
import { renderHook } from '@testing-library/react';
import { useMap } from '../useMap';

describe('useMap with YourMap provider', () => {
  test('should initialize with YourMap provider', async () => {
    const { result, waitFor } = renderHook(() => 
      useMap(true, { preferredProvider: 'yourmap' })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.error).toBeNull();
  });
});
```

## 🎯 Best Practices

### Error Handling
- Always implement proper error handling in provider methods
- Provide meaningful error messages for debugging
- Implement graceful degradation when features aren't available

### Performance
- Lazy load map SDKs to improve initial load times
- Implement marker clustering for large datasets
- Use requestAnimationFrame for smooth animations

### Accessibility
- Ensure map controls are keyboard accessible
- Provide alternative text for map content
- Support screen readers where possible

### Consistency
- Follow the same coordinate system (lat, lng) across all providers
- Maintain consistent marker behavior and styling
- Ensure event handling works identically across providers

## 🔍 Debugging

### Common Issues

1. **Provider not loading**: Check SDK availability and API keys
2. **Markers not appearing**: Verify coordinate format and bounds
3. **Events not firing**: Ensure event handlers are properly bound
4. **Styling issues**: Check CSS conflicts and z-index problems

### Debug Tools

Add debug logging to your provider:

```typescript
private debug(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[YourMapProvider] ${message}`, data);
  }
}
```

### Provider Status

Add a status endpoint to check provider health:

```typescript
async getProviderStatus(): Promise<{
  available: boolean;
  version: string;
  features: string[];
  issues?: string[];
}> {
  return {
    available: await this.isAvailable(),
    version: this.version,
    features: ['markers', 'popups', 'events', 'layers'],
    issues: [] // Any known issues
  };
}
```

## 📖 Examples

### Google Maps Provider

See `examples/GoogleMapsProvider.ts` for a complete Google Maps implementation.

### Mapbox Provider

See `examples/MapboxProvider.ts` for a complete Mapbox implementation.

### Testing Provider

See `examples/MockMapProvider.ts` for a testing/mock implementation.

## 🤝 Contributing

When contributing a new map provider:

1. **Follow the interface exactly** - All methods must be implemented
2. **Add comprehensive tests** - Unit and integration tests required
3. **Document configuration** - Update config files and README
4. **Test fallback behavior** - Ensure graceful degradation
5. **Update examples** - Provide working code samples

## 📞 Support

For help with map provider integration:

- **Documentation**: Check the provider's official documentation
- **Issues**: Create a GitHub issue with provider-specific tag
- **Community**: Join discussions in our developer forum
- **Examples**: Reference existing provider implementations

---

**🗺️ Happy Mapping!** - Building robust, provider-agnostic mapping solutions for emergency response.

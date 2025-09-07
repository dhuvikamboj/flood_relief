import {
  IMapProvider,
  MapConfiguration,
  MapProviderResult,
  MapProviderConfig,
  MapProviderError,
  MapInitializationError
} from './mapTypes';
import LeafletMapProvider from './LeafletMapProvider';

// Available map providers
const PROVIDERS = {
  leaflet: () => new LeafletMapProvider(),
  // google: () => new GoogleMapsProvider(), // Future implementation
  // mapbox: () => new MapboxProvider(),     // Future implementation
} as const;

export type AvailableProviders = keyof typeof PROVIDERS;

export class MapProviderFactory {
  private static instance: MapProviderFactory;
  private config: MapProviderConfig;
  private providers = new Map<string, IMapProvider>();

  private constructor(config?: Partial<MapProviderConfig>) {
    this.config = {
      defaultProvider: 'leaflet',
      providers: {
        leaflet: {
          enabled: true,
          priority: 1
        }
      },
      fallback: {
        enabled: true,
        provider: 'leaflet'
      },
      ...config
    };
  }

  static getInstance(config?: Partial<MapProviderConfig>): MapProviderFactory {
    if (!MapProviderFactory.instance) {
      MapProviderFactory.instance = new MapProviderFactory(config);
    }
    return MapProviderFactory.instance;
  }

  static reset(): void {
    if (MapProviderFactory.instance) {
      MapProviderFactory.instance.cleanup();
      MapProviderFactory.instance = null as any;
    }
  }

  /**
   * Create a map instance using the specified or default provider
   */
  async createMap(
    mapConfig: MapConfiguration,
    preferredProvider?: string
  ): Promise<MapProviderResult> {
    const provider = await this.getProvider(preferredProvider);
    const instance = await provider.initialize(mapConfig);
    
    return {
      provider,
      instance
    };
  }

  /**
   * Get a provider instance, with fallback support
   */
  private async getProvider(preferredProvider?: string): Promise<IMapProvider> {
    const providerName = preferredProvider || this.config.defaultProvider;
    
    // Check if provider is supported and enabled
    const providerConfig = this.config.providers[providerName];
    if (!providerConfig?.enabled) {
      if (this.config.fallback.enabled && this.config.fallback.provider) {
        console.warn(`Provider '${providerName}' is not enabled, falling back to '${this.config.fallback.provider}'`);
        return this.getProvider(this.config.fallback.provider);
      }
      throw new MapProviderError(`Provider '${providerName}' is not enabled`, providerName, 'PROVIDER_DISABLED');
    }

    // Return cached provider if available
    if (this.providers.has(providerName)) {
      return this.providers.get(providerName)!;
    }

    // Create new provider instance
    const provider = await this.createProviderInstance(providerName);
    
    // Verify provider is supported
    if (!provider.isSupported()) {
      if (this.config.fallback.enabled && this.config.fallback.provider && this.config.fallback.provider !== providerName) {
        console.warn(`Provider '${providerName}' is not supported, falling back to '${this.config.fallback.provider}'`);
        return this.getProvider(this.config.fallback.provider);
      }
      throw new MapProviderError(`Provider '${providerName}' is not supported in this environment`, providerName, 'PROVIDER_UNSUPPORTED');
    }

    // Cache the provider
    this.providers.set(providerName, provider);
    
    return provider;
  }

  /**
   * Create a new provider instance
   */
  private async createProviderInstance(providerName: string): Promise<IMapProvider> {
    const providerFactory = PROVIDERS[providerName as AvailableProviders];
    
    if (!providerFactory) {
      throw new MapProviderError(`Unknown provider: ${providerName}`, providerName, 'PROVIDER_UNKNOWN');
    }

    try {
      return providerFactory();
    } catch (error) {
      throw new MapInitializationError(providerName, error as Error);
    }
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Object.keys(PROVIDERS).filter(name => {
      const config = this.config.providers[name];
      return config?.enabled !== false;
    });
  }

  /**
   * Get list of supported providers (available AND working in current environment)
   */
  async getSupportedProviders(): Promise<string[]> {
    const available = this.getAvailableProviders();
    const supported: string[] = [];

    for (const providerName of available) {
      try {
        const provider = await this.createProviderInstance(providerName);
        if (provider.isSupported()) {
          supported.push(providerName);
        }
      } catch (error) {
        console.warn(`Provider '${providerName}' failed support check:`, error);
      }
    }

    return supported;
  }

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<MapProviderConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Clear cached providers if config changed
    this.providers.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): MapProviderConfig {
    return { ...this.config };
  }

  /**
   * Check if a specific provider is available and enabled
   */
  isProviderAvailable(providerName: string): boolean {
    const config = this.config.providers[providerName];
    return config?.enabled === true && providerName in PROVIDERS;
  }

  /**
   * Cleanup all cached providers
   */
  cleanup(): void {
    this.providers.forEach(provider => {
      try {
        provider.cleanup();
      } catch (error) {
        console.warn('Error during provider cleanup:', error);
      }
    });
    this.providers.clear();
  }
}

// Default factory instance
export const mapProviderFactory = MapProviderFactory.getInstance();

// Convenience function for creating maps
export async function createMap(
  mapConfig: MapConfiguration,
  preferredProvider?: string
): Promise<MapProviderResult> {
  return mapProviderFactory.createMap(mapConfig, preferredProvider);
}

// Convenience function for getting supported providers
export async function getSupportedProviders(): Promise<string[]> {
  return mapProviderFactory.getSupportedProviders();
}

export default MapProviderFactory;

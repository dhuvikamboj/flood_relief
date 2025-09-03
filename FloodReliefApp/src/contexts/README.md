# Location Context System

This document explains how to use the shared location functionality in the Flood Relief App.

## Overview

The location functionality has been refactored to use React Context for better sharing and reusability across components. The location state is now managed globally and can be accessed from any component within the app.

## Architecture

### LocationContext (`src/contexts/LocationContext.tsx`)
- **LocationProvider**: Wraps the app to provide location context
- **useLocation**: Hook to access location functionality
- Manages location state, geolocation watching, and error handling

### Key Features
- ✅ Global location state management
- ✅ Automatic location watching (configurable)
- ✅ Error handling and loading states
- ✅ Background location updates
- ✅ Reusable across all components

## Usage

### 1. App Setup (Already Done)
The `LocationProvider` is already wrapped around the app in `App.tsx`:

```tsx
const App: React.FC = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </AuthProvider>
  );
};
```

### 2. Using Location in Components

#### Basic Usage
```tsx
import { useLocation } from '../hooks/useLocation';

const MyComponent: React.FC = () => {
  const {
    userCoords,
    accuracy,
    lastUpdated,
    mapLoading,
    mapError,
    watching,
    refreshLocation,
    getCurrentLocation,
    clearLocation
  } = useLocation();

  return (
    <div>
      {userCoords && (
        <p>Location: {userCoords.lat}, {userCoords.lng}</p>
      )}
      <button onClick={refreshLocation}>Refresh Location</button>
    </div>
  );
};
```

#### Advanced Usage with Error Handling
```tsx
const MyComponent: React.FC = () => {
  const { userCoords, mapLoading, mapError, getCurrentLocation } = useLocation();

  const handleGetLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      console.log('Got location:', coords);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  return (
    <div>
      {mapLoading && <p>Loading location...</p>}
      {mapError && <p>Error: {mapError}</p>}
      <button onClick={handleGetLocation} disabled={mapLoading}>
        Get Current Location
      </button>
    </div>
  );
};
```

### 3. Location Status Component

A reusable component is available at `src/components/LocationStatus.tsx`:

```tsx
import LocationStatus from '../components/LocationStatus';

const MyPage: React.FC = () => {
  return (
    <IonContent>
      <LocationStatus showControls={true} />
      {/* Your other content */}
    </IonContent>
  );
};
```

## Available Methods

### Location Data
- `userCoords: {lat: number, lng: number} | null` - Current user coordinates
- `accuracy: number | null` - Location accuracy in meters
- `lastUpdated: Date | null` - When location was last updated
- `mapLoading: boolean` - Whether location is being fetched
- `mapError: string | null` - Any location errors
- `watching: boolean` - Whether location watching is active

### Methods
- `refreshLocation(): void` - Refresh current location
- `getCurrentLocation(): Promise<{lat: number, lng: number}>` - Get current location once
- `clearLocation(): void` - Stop location watching
- `setUserCoords(coords: {lat: number, lng: number} | null): void` - Manually set coordinates

## Configuration

### Auto-Watching
By default, location watching starts automatically when the app loads. This can be configured in the `LocationProvider`:

```tsx
<LocationProvider autoWatch={false}>
  <AppContent />
</LocationProvider>
```

### Location Options
The geolocation API uses these default options:
- `enableHighAccuracy: true`
- `maximumAge: 30000` (30 seconds)
- `timeout: 15000` (15 seconds)

## Error Handling

The context handles common location errors:
- **Permission denied**: User denied location access
- **Timeout**: Location request timed out
- **Unavailable**: Geolocation not supported
- **Network errors**: Connection issues

## Best Practices

1. **Check for errors**: Always handle `mapError` in your UI
2. **Loading states**: Show loading indicators when `mapLoading` is true
3. **Permission handling**: Guide users to enable location permissions
4. **Fallbacks**: Provide alternatives when location is unavailable
5. **Performance**: Use `watching` state to avoid unnecessary API calls

## Migration from Old Hook

If you were using the old `useLocation` hook with options:

```tsx
// Old way (no longer supported)
const location = useLocation({ autoWatch: false });

// New way
const location = useLocation(); // Always uses context settings
```

The new system automatically manages location watching based on the `LocationProvider` configuration.

## Troubleshooting

### "useLocation must be used within a LocationProvider"
- Make sure your component is wrapped with `LocationProvider`
- Check that the provider is at the correct level in the component tree

### Location not updating
- Check browser permissions for geolocation
- Try `refreshLocation()` to force an update
- Check `mapError` for specific error messages

### Performance issues
- Location watching runs in the background
- Use `clearLocation()` when not needed
- Consider using `getCurrentLocation()` for one-time requests

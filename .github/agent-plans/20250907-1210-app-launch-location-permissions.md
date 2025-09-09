# Add Location Permission Request on App Launch

## Goal
Implement proactive location permission request when the app is launched to improve user experience and ensure location services are available.

## Requirements checklist
- [ ] Install Capacitor Geolocation plugin for native permission handling
- [ ] Create location permission service/hook for requesting permissions on app launch
- [ ] Integrate permission request in app initialization flow
- [ ] Handle permission states (granted, denied, not determined)
- [ ] Provide user-friendly messaging for permission requests
- [ ] Test on Android to ensure permissions work correctly

## Assumptions and scope boundaries
- Using Capacitor Geolocation plugin for native permission handling
- Request will be made during app initialization, not on first location use
- Graceful fallback if permissions are denied
- User can still use app without location if they deny permissions

## Short contract
- **Inputs**: Current location context with delayed permission request
- **Outputs**: Proactive location permission request on app launch with user-friendly UI
- **Success criteria**: App requests location permissions immediately on launch, handles all permission states
- **Error modes**: Permission request fails, network issues, plugin installation issues

## Plan (ordered steps) and Files to touch
1. Install @capacitor/geolocation plugin 
2. Create a location permission service/hook
3. Modify the app initialization to request permissions early
4. Update LocationContext to use Capacitor Geolocation for better permission handling
5. Add user-friendly permission request UI/messaging
6. Test and validate functionality

**Files to touch:**
- `package.json` (add geolocation plugin)
- `src/hooks/useLocationPermissions.ts` (new file for permission logic)
- `src/App.tsx` (integrate permission request on launch)
- `src/contexts/LocationContext.tsx` (enhance with Capacitor integration)
- Update Capacitor sync for new plugin

## Validation plan
- **Build**: `npm run build` → should complete successfully
- **Lint/Static analysis**: Check TypeScript compilation
- **Tests**: Manual testing on Android device/emulator
- **Quick smoke**: Verify permission dialog appears on app launch

## Rollback & safety plan
- Keep existing web geolocation as fallback
- If Capacitor plugin fails, gracefully fall back to browser geolocation
- Permission request is non-blocking and app remains functional if denied

## Progress log
- 2025-09-07T20:10Z — Created plan, analyzing current location implementation

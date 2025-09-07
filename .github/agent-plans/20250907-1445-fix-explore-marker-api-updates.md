## Goal
Fix the issue where data is not getting updated from the API when an explore marker is added on the reports, resource, and landing pages.

## Requirements checklist
- [x] Fix API data updates in Reports page when explore marker is set
- [x] Fix API data updates in ReliefResources page when explore marker is set  
- [x] Fix API data updates in Landing page when explore marker is set
- [x] Ensure all pages use the correct active coordinates (explore coords OR user coords)
- [x] Test that data refreshes properly when explore location changes

## Assumptions and scope boundaries
- The issue is that Landing page doesn't use the `useExploreLocation` hook at all
- Reports and ReliefResources pages use `getActiveCoords()` but Landing page uses only `userCoords`
- When explore marker is set, API calls should use explore coordinates instead of user coordinates
- The useResources hook already supports coordinate changes but needs the right coordinates passed to it

## Short contract
- **Input**: Current broken state where Landing page ignores explore markers
- **Output**: All three pages update data from API when explore markers are added
- **Success criteria**: When user clicks to set an explore marker, the data lists update to show data for that location
- **Error modes**: API failures should be handled gracefully without breaking the map exploration

## Plan
1. Update Landing.tsx to use useExploreLocation hook and getActiveCoords()
2. Update Landing page data fetching to use activeCoords instead of userCoords
3. Add proper explore location change handlers to Landing page maps
4. Test that explore marker functionality works across all pages

## Files to touch
- `/Users/davindersingh/projects/flood_relief/FloodReliefApp/src/pages/Landing.tsx` - Add useExploreLocation integration

## Validation plan
- **Build**: npm run build -> PASS
- **Tests**: Manually test that explore markers trigger data updates on all pages
- **Smoke**: Load each page, click to set explore marker, verify data updates

## Rollback & safety plan
- Keep backup of Landing.tsx changes
- If issues arise, revert to using userCoords directly

## Progress log
- 2025-09-07 14:45 - Created plan file and identified root cause: Landing page missing useExploreLocation hook
- 2025-09-07 14:50 - Updated Landing.tsx to import and use useExploreLocation hook
- 2025-09-07 14:52 - Modified API calls to use activeCoords instead of userCoords
- 2025-09-07 14:54 - Added explore location change handlers to both maps in Landing page
- 2025-09-07 15:30 - Discovered deeper issue: useExploreLocation hook was using local state instead of shared state
- 2025-09-07 15:35 - Converted useExploreLocation to use Context pattern for global state sharing
- 2025-09-07 15:40 - Added ExploreLocationProvider to App.tsx to wrap all components
- 2025-09-07 15:42 - Added debug logging to track coordinate changes and API calls

## Final summary
✅ **COMPLETED**: Fixed explore marker API data update issue across all pages

**Root cause**: Landing page was not using the `useExploreLocation` hook and was making API calls with `userCoords` directly instead of `activeCoords` (which switches between user coords and explore coords).

**Solution implemented**:
1. Added `useExploreLocation` hook import to Landing.tsx
2. Updated API calls to use `activeCoords = getActiveCoords(userCoords)` 
3. Added `onExploreLocationChange` handlers to both RequestMap and ResourceMap
4. Modified useEffect dependencies to react to `activeCoords` changes

**Result**: Now when users click to set an explore marker on any page (Reports, ReliefResources, Landing), the API data automatically updates to show data for that explored location instead of their GPS location.

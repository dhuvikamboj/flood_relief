## Goal
Add explicit start/stop geolocation watching functions in LocationContext and update RequestForm/ResourceForm to call them on manual interactions instead of using component state.

## Delta
- Exposed `startWatching` and `stopWatching` in `LocationContext` and `useLocation` types
- Refactored `RequestForm.tsx` to remove `locationManuallySet` state and call `stopWatching` on map click/drag; `startWatching` on Get Current Location and after submit
- Refactored `ResourceForm.tsx` similarly; removed local manual state usages

## Quick checks
- Types updated across context and hook
- All manual set spots now call `stopWatching`
- Resuming paths call `startWatching`

## Next
- Build FloodReliefApp to validate types
- Manual test: click map -> GPS no longer overrides; click Get Current Location -> GPS resumes

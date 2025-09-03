Goal
- Finalize RequestForm map to use Leaflet (npm package) only and ensure marker interactions update the form location and coords; avoid HMR double-initialization errors.

Requirements checklist
- [x] Use Leaflet library (npm) directly in `RequestForm.tsx` (no react-leaflet or CDN loader).
- [x] Initialize map imperatively on a single div ref and attach Esri World Imagery tiles (satellite).
- [x] Create a draggable marker and allow map click to set/update marker position.
- [x] Sync marker position with form `location` input (lat,lng) and `userCoords` state.
- [x] Ensure cleanup on unmount to prevent "Map container is already initialized" during HMR.
- [x] Keep existing form fields (address, contact, type, priority, details, media uploads) intact.

Assumptions
- The project uses Vite + TypeScript and the FloodReliefApp has Leaflet installed (`leaflet` and `@types/leaflet`).
- React 19 is the project's React version; react-leaflet is intentionally not used to avoid peer-dep issues.
- The dev server may run with HMR; cleanup must remove previous Leaflet instances.

Plan
1. Add Leaflet imports and marker assets to `RequestForm.tsx` (done).
2. Replace dynamic CDN loading/react-leaflet usage with a single effect that initializes L.map on a div ref and wires click/drag events (done).
3. Ensure L.Icon.Default asset URLs are set for the bundler (done).
4. Run TypeScript type-check for FloodReliefApp to confirm no TS errors and fix any if present.
5. (Optional) Start dev server and manually verify map behavior (not executed automatically in this plan).

Validation plan
- Run `npx tsc --noEmit` in `FloodReliefApp` and expect no TypeScript errors for modified files.
- Manual smoke: open `/tabs/request/new` in dev app and verify map loads, clicking sets `location`, dragging marker updates `location`.

Progress log
- 2025-09-02 15:00: created plan file and finalized a code edit in `RequestForm.tsx` to import Leaflet and initialize map imperatively.
- 2025-09-02 15:02: wired draggable marker and click handler; ensured cleanup on unmount.

Todos
- Start dev server and manually confirm HMR resilience and UX (user can request this).

Done
- Implemented Leaflet-only initialization in `RequestForm.tsx` with satellite tiles, marker behaviors, and cleanup.

Decisions
- Chose Esri World Imagery tile layer for satellite view.
- Avoided react-leaflet to prevent peer dependency issues with React 19.


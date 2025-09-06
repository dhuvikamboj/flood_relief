# Map Navigation Rendering Fix Plan

## Goal
Fix map rendering issues when navigating between add forms (`/tabs/request/new`, `/tabs/resource/new`) and back to tabs with maps.

## Requirements Checklist
- [x] Identify the navigation flow causing map issues
- [x] Enhance map initialization robustness after page navigation
- [x] Add proper cleanup and re-initialization logic
- [ ] Test navigation between forms and map views
- [ ] Ensure maps render correctly in all scenarios

## Assumptions and Scope
- Issue is related to Leaflet map lifecycle during navigation
- Map containers might have stale references or sizing issues
- Both Landing page and Reports page affected since they use maps
- Form pages (RequestForm, ResourceForm) properly clean up their maps

## Plan (Ordered Steps)
1. **Enhance useResourceMap hook** - Add more robust navigation detection and cleanup
2. **Add page visibility detection** - Detect when pages become visible after navigation
3. **Improve map initialization timing** - Add better container readiness checks
4. **Add map refresh mechanism** - Force map refresh when navigation detected
5. **Test the fix** - Navigate between forms and tabs to verify maps render correctly

## Files to Touch
- `src/hooks/useResourceMap.ts` - Main map hook enhancement
- `src/pages/Landing.tsx` - Add navigation detection if needed
- `src/pages/Reports.tsx` - Add navigation detection if needed
- `src/components/RequestMap.tsx` - Verify proper prop handling
- `src/components/ResourceMap.tsx` - Verify proper prop handling

## Validation Plan
1. Build the project without TypeScript errors
2. Navigate from Landing page to RequestForm (/tabs/request/new)
3. Navigate back to Landing page - verify maps render correctly
4. Navigate from Landing page to ResourceForm (/tabs/resource/new)
5. Navigate back to Landing page - verify maps render correctly
6. Test same flow with Reports page
7. Test tab switching within Landing page still works

## Progress Log

### Initial Analysis (08:30)
- Identified navigation structure: forms use direct Leaflet, main pages use useResourceMap hook
- Found existing cleanup logic in both RequestForm and ResourceForm
- Current useResourceMap has some navigation handling but needs enhancement
- Issue likely: timing problems with map container readiness after navigation

### Implementation Complete (08:30-08:45)
- Enhanced useResourceMap hook with robust navigation detection
- Added page visibility API for detecting navigation returns
- Improved container readiness checks with exponential backoff
- Added map re-initialization logic for detached containers
- Enhanced RequestMap component with similar navigation handling
- Build passes successfully with all TypeScript checks

### Key Changes Made:
1. **useResourceMap.ts**: 
   - Added page visibility detection using document.visibilitychange
   - Enhanced container readiness checks with `isContainerReady()` function
   - Added exponential backoff for initialization attempts
   - Improved map re-initialization logic for detached containers
   - Added robust null checking for all map operations

2. **RequestMap.tsx**:
   - Added page visibility detection for consistency
   - Enhanced navigation refresh logic

### Critical Bug Fix - Null Reference Error (08:45-09:00)
- **Issue**: `Cannot read properties of null (reading 'parentNode')` error in Leaflet layer removal
- **Root Cause**: Attempting to remove layers/markers that are already detached from DOM
- **Location**: RequestMap.tsx line 222 and similar cleanup code

### Comprehensive Error Handling Added:
1. **RequestMap.tsx**:
   - Added try-catch blocks around all `removeLayer()` calls
   - Added `hasLayer()` checks before removal
   - Enhanced cleanup in component unmount
   - Fixed marker cleanup in useEffect cleanup

2. **useResourceMap.ts**:
   - Added error handling for tile layer removal
   - Enhanced marker cleanup with proper null checks
   - Improved final cleanup on component unmount

3. **Reports.tsx**:
   - Fixed CSS visibility issue (changed from `display: none` to CSS visibility)
   - Added page visibility detection for navigation
   - Enhanced map visibility conditions

### Layer Rendering Fix - Navigation Issues (09:00-09:15)
- **Issue**: Map tile layers not rendering after navigating between pages
- **Root Cause**: Layer initialization timing issues and missing validation after navigation
- **Affected**: Reports page map and other pages using RequestMap/useResourceMap

### Layer Rendering Enhancements:
1. **RequestMap.tsx**:
   - Added retry logic for initial layer addition
   - Added layer validation effect to detect missing layers after navigation
   - Enhanced layer change effect with visibility checks and retry mechanisms
   - Added `hasLayer()` checks to prevent duplicate layer additions

2. **useResourceMap.ts**:
   - Similar retry logic and validation for resource maps
   - Enhanced layer change effect with visibility-aware logic
   - Added post-navigation layer validation

3. **Key Improvements**:
   - Layer validation after page visibility changes
   - Retry mechanisms for failed layer additions
   - Visibility-aware layer management
   - Duplicate layer prevention with `hasLayer()` checks

### Build Status: Ready for testing layer rendering after navigation

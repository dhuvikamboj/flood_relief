# Add Debounce on API Calls

## Goal
Implement proper debouncing on API calls throughout the FloodReliefApp to improve performance and reduce server load by preventing excessive API requests when filters or search terms change rapidly.

## Requirements checklist
- Add debouncing to API calls in Landing page for both requests and resources
- Ensure existing debouncing in Reports page and useResources hook is working correctly
- Add debouncing to search functionality where missing
- Maintain existing offline-first caching behavior
- Use consistent debounce delay (500ms) across the application

## Assumptions
- The application already has some debouncing implemented in Reports.tsx and useResources.ts
- We should maintain the existing patterns and improve where needed
- 500ms debounce delay is appropriate for the use case
- API calls should be debounced when triggered by user input or filter changes

## Plan
1. Review existing debouncing implementations in Reports.tsx and useResources.ts
2. Add debouncing to Landing.tsx for both requests and resources data fetching
3. Ensure consistent debounce patterns across all API-calling components
4. Test that offline-first caching behavior is preserved
5. Verify all filter changes and search input trigger debounced API calls

## Files to touch
- `/Users/davindersingh/projects/flood_relief/FloodReliefApp/src/pages/Landing.tsx` - Add debouncing to fetchData and fetchResourceData
- Possibly improve existing debouncing in other files if needed

## Validation plan
- Build the project to ensure no TypeScript errors
- Verify debouncing works correctly by checking that rapid filter changes don't trigger multiple API calls
- Ensure cached data loading behavior is maintained

## Progress log
- 2025-09-05 15:14 - Created plan file and analyzing current debouncing implementations

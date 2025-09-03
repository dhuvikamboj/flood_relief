# RequestForm Location Timeout Fix - 2025-09-03

## Goal
Fix location fetching timeout issue when navigating from Reports page to RequestForm page by improving the location hook and error handling.

## Requirements checklist
- [x] Add one-time location fetching option to useLocation hook
- [x] Update RequestForm to use getCurrentLocation instead of watchPosition
- [x] Add proper error handling and user feedback
- [x] Add loading state to GPS button
- [x] Display location errors to user
- [x] Reduce timeout from 20s to 15s for faster feedback
- [x] Ensure TypeScript compilation passes

## Assumptions and scope boundaries
- Keep existing watchPosition functionality for continuous location updates
- Add getCurrentPosition for one-time location requests
- Improve error messages for better user experience
- Maintain backward compatibility with existing hook usage

## Plan
1. Extend useLocation hook with getCurrentLocation function
2. Update RequestForm to use getCurrentLocation for GPS button
3. Add loading states and error display
4. Improve timeout settings (15s instead of 20s)
5. Add proper async/await error handling
6. Test compilation and functionality

## Files to touch
- `src/hooks/useLocation.ts` (extend with getCurrentLocation)
- `src/pages/RequestForm.tsx` (update GPS button and error handling)
- `src/pages/RequestForm.css` (add error styling)

## Validation plan
- TypeScript compilation passes without errors
- GPS button shows loading state during location fetch
- Location errors are displayed to user
- Location fetch completes within 15 seconds
- Map updates correctly when location is found
- Form submission works with fetched coordinates

## Progress log
- 2025-09-03 13:45: Extended useLocation hook with getCurrentLocation function
- 2025-09-03 13:50: Updated RequestForm to use async getCurrentLocation with proper error handling
- 2025-09-03 13:55: Added loading state to GPS button and error display
- 2025-09-03 14:00: Reduced timeout from 20s to 15s for faster feedback
- 2025-09-03 14:05: Added location-error CSS class for proper styling
- 2025-09-03 14:10: Verified TypeScript compilation passes without errors

## Final summary
Successfully fixed the location timeout issue by adding a one-time location fetching option to the useLocation hook. The RequestForm now uses getCurrentPosition instead of watchPosition for the GPS button, which provides faster feedback and better error handling. Added loading states, error display, and improved timeout settings for better user experience.

## Files/sections touched
- **Modified**: `src/hooks/useLocation.ts` - Added getCurrentLocation function with 15s timeout
- **Modified**: `src/pages/RequestForm.tsx` - Updated GPS button with async handling and error display
- **Modified**: `src/pages/RequestForm.css` - Added location-error styling class

## Follow-ups
- Test location functionality across different browsers/devices
- Consider adding retry functionality for failed location requests
- Could add location permission checking before attempting to fetch location

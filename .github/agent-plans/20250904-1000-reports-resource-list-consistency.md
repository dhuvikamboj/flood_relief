# Make Reports Page Consistent with Resource List

## Goal
Make the reports page consistent with the resource list page structure, styling, and components.

## Requirements Checklist
- [ ] Use similar component structure as ReliefResources.tsx
- [ ] Implement floating filters for Reports page
- [ ] Add tab segmentation (map/list view)
- [ ] Use same styling patterns
- [ ] Maintain existing functionality
- [ ] Keep consistent UI/UX patterns

## Assumptions and Scope Boundaries
- Keep all existing functionality in Reports page
- Use existing CSS classes and patterns from Reports.css
- Integrate with existing hooks and context providers
- Maintain the same data flow and API calls

## Plan (Ordered Steps)
1. Create FloatingFilters component for requests (similar to resources)
2. Create RequestCard component to match ResourceCard styling
3. Create RequestModal component to match ResourceModal
4. Refactor Reports.tsx to use tab structure like ReliefResources.tsx
5. Update imports and component structure
6. Test functionality and fix any issues

## Files to Touch
- `/FloodReliefApp/src/pages/Reports.tsx` - Main component refactor
- `/FloodReliefApp/src/components/RequestCard.tsx` - New component
- `/FloodReliefApp/src/components/RequestModal.tsx` - New component
- `/FloodReliefApp/src/components/RequestFilters.tsx` - New component (if needed)
- `/FloodReliefApp/src/pages/Reports.css` - Style updates

## Validation Plan
- Build successfully without errors
- Map view works correctly
- List view displays requests properly
- Filters work as expected
- Modal opens and closes correctly
- All existing functionality preserved

## Progress log

- 10:00 - Created plan file
- 10:15 - Examined resource list structure and components
- 10:20 - Created RequestCard component matching ResourceCard design
- 10:25 - Created RequestModal component matching ResourceModal design
- 10:30 - Created RequestMap component
- 10:35 - Created RequestFilters component
- 10:40 - Refactored Reports.tsx to use new components
- 10:45 - Tested application build - Success!
- 11:00 - User requested making filter popover responsive
- 11:05 - Analyzing current filter popover structure for responsive improvements

## Additional Requirements: Responsive Filter Popover

- [ ] Make filter popover adapt to different screen sizes
- [ ] Ensure proper touch targets on mobile
- [ ] Optimize layout for tablet and desktop
- [ ] Improve accessibility for different screen sizes

## Responsive Design Plan

1. Add media queries for mobile, tablet, and desktop breakpoints
2. Adjust popover positioning and sizing based on screen size
3. Optimize touch targets and spacing for mobile devices
4. Ensure proper content scrolling on smaller screens
5. Test across different viewport sizes

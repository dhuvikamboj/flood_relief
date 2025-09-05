# Add App Information to Landing Page

## Goal
Add concise information about the flood relief app, its purpose, problem it solves, and how people can help, plus login/signup links on the landing page.

## Requirements checklist
- [ ] Add app description explaining what it does
- [ ] Explain what problem it solves 
- [ ] Show how people can help
- [ ] Add login link
- [ ] Add signup link
- [ ] Keep design concise and informative

## Assumptions and scope boundaries
- Will add info section at the top of the landing page before the map/list toggle
- Login/signup links will be prominent but not intrusive
- Keep messaging clear and action-oriented for emergency response context
- Will need to check if auth routes exist in the app

## Plan (ordered steps)
1. Examine current Landing.tsx structure and styling
2. Check for existing auth routes/navigation
3. Add informational header section with app description
4. Add login/signup buttons with proper navigation
5. Test the changes

## Files to touch
- `/Users/davindersingh/projects/flood_relief/FloodReliefApp/src/pages/Landing.tsx`
- Possibly auth-related routes/components if they exist

## Validation plan
- Build the app successfully
- Verify layout looks good on different screen sizes
- Check that login/signup links work (even if they lead to placeholder pages)

## Progress log
**2025-09-05 11:30** - Started task, creating plan

# Add Phone to Reported By Details

## Goal
Add the reporter's phone number to the "reported by" information displayed for relief requests in the app.

## Requirements checklist
- [ ] Include reporter's phone number in the backend API response for relief requests
- [ ] Update frontend to display the phone number in the request details (popup, list, modal)

## Assumptions
- The `phone` field exists in the `users` table and is accessible via the User model
- The frontend can handle the additional field without breaking existing functionality

## Plan (ordered steps) and Files to touch
1. Update `ReliefRequestController.php` to include `phone` in the SELECT query for the index method
2. Update `Reports.tsx` to add `phone` to the request interface and display it in the UI components
3. Test the changes by running the app and verifying the phone number appears

## Validation plan
- Start the Laravel server and frontend
- Submit a relief request (if needed) or view existing ones
- Check that the phone number is displayed in the map popup, list view, and modal
- Ensure no errors in console or API responses

## Progress log
- [2025-09-03 12:00] Plan created
- [2025-09-03 12:00] Read User model to confirm phone field exists
- [2025-09-03 12:05] Updated ReliefRequestController.php to include phone in query
- [2025-09-03 12:10] Updated Reports.tsx to display phone
- [2025-09-03 12:15] Tested changes - phone displays correctly

## Todos
- Update backend query
- Update frontend display
- Validate functionality

## Done
- Confirmed phone field in User model
- Updated backend query
- Updated frontend display

## Decisions
- Added phone to the same places as reporter_name and reporter_email for consistency

Goal
- Remove dashboard link button from top headers in the Ionic React frontend pages.

Requirements checklist
- Remove dashboard header button (routerLink="/dashboard") from pages where it appears in header toolbars.
- Add a small agent plan file documenting the change.

Assumptions
- "Header" refers to the Ionic Toolbar header buttons in the React frontend pages under `FloodReliefApp/src/pages/`.
- Keep translation strings intact; only remove the clickable header button UI.

Plan
1. Search for occurrences of `routerLink="/dashboard"` (done).
2. Edit the pages to remove the IonButton with the dashboard link.
3. Run a quick frontend build to validate no syntax errors.

Files touched
- `src/pages/Reports.tsx` — removed header dashboard IonButton
- `src/pages/ReliefResources.tsx` — removed header dashboard IonButton
- `.github/agent-plans/20250906-1430-remove-dashboard-link.md` — this plan file

Validation
- Run `npm run build` in `FloodReliefApp` and report PASS/FAIL.

Progress log
- 2025-09-06 14:30 — Plan created and edits applied.

Decision
- Only removing the header button elements to satisfy the request with minimal risk.

Next steps
- If the user wants the dashboard link removed from other places (welcome page, server-side views), I'll remove those too after confirmation.

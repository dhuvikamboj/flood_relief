Goal
- Explain why FloatingFilters appears in the reports/list view and implement a minimal fix so it only shows in the map view.

Requirements checklist
- Explain why the `FloatingFilters` component is visible in the reports/list view (ReliefResources page).
- Provide and apply a minimal code change so `FloatingFilters` does not show in the reports/list view.
- Create an agent plan file for this edit (repo convention).

Assumptions
- The `reports list` the user refers to is the data/list tab within `ReliefResources.tsx`.
- Hiding the floating filters on the data/list tab is acceptable; alternative is to add visibility prop.

Plan
- Update `ReliefResources.tsx` to render `<FloatingFilters />` only when `activeTab === 'map'`.
- Add this plan file to `.github/agent-plans/` as required by repo agent workflow.

Validation plan
- Manual code inspection to confirm conditional render.
- (Optional) Run frontend build later if requested.

Progress log
- 2025-09-06 09:00 - Created plan and implemented conditional rendering in `ReliefResources.tsx` so `FloatingFilters` no longer appears in list view.

Done
- Conditional rendering implemented and plan file added.

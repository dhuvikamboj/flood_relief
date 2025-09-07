Goal: Add comprehensive data access analytics to track user interactions with relief data, requests, resources, and content throughout the Flood Relief app.

Requirements:
- Track data viewing patterns (reports, resources lists)
- Track data interaction events (filtering, searching, sorting)
- Track individual item access (viewing specific requests/resources)
- Track data engagement metrics (time spent, scroll depth)
- Track user journey through data exploration
- Ensure analytics respect user privacy and data sensitivity

Assumptions and scope boundaries:
- Focus on read/view operations, not write operations (already covered in GA4 setup)
- Track aggregate patterns, not individual user data
- Respect privacy - no tracking of sensitive personal information
- Include time-based metrics and engagement tracking
- Scope limited to main data viewing components

Short contract:
- Inputs: Existing data components and user flows
- Outputs: Enhanced analytics tracking for data access patterns
- Success criteria: Comprehensive tracking of data viewing and interaction patterns
- Error modes: Analytics failures don't break app functionality

Plan:
1. Create plan file (this file)
2. Analyze existing data components and access patterns
3. Add tracking to Reports page (list viewing, filtering, individual item access)
4. Add tracking to ReliefResources page (list viewing, filtering, individual item access)
5. Add tracking to Profile page (user data access)
6. Add engagement tracking (time spent, scroll events)
7. Test analytics implementation

Files to touch:
- FloodReliefApp/src/pages/Reports.tsx (list viewing, filtering, item access)
- FloodReliefApp/src/pages/ReliefResources.tsx (list viewing, filtering, item access)
- FloodReliefApp/src/pages/Profile.tsx (user data access)
- FloodReliefApp/src/pages/Home.tsx (dashboard data access)
- FloodReliefApp/src/components/ (any data display components)

Validation plan:
- Build: npm run build -> PASS
- Lint: npm run lint -> PASS
- Tests: npm run test.unit -> PASS (if any)
- Smoke: App loads without errors, analytics events fire correctly

Rollback & safety plan:
- Remove GA4 event calls from data components
- Keep core GA4 initialization intact

Progress log:
- 2025-09-07T12:30Z — Created plan

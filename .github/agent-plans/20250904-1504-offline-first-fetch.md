Goal

Make data fetching in the FloodReliefApp offline-first for resources and comments: return cached data immediately (from AsyncStorage), then refresh from network and update cache.

Requirements checklist

- Load cached resources/comments from AsyncStorage and show them immediately.
- Perform network request after serving cache to refresh state and cache.
- Use the existing axios wrapper (`services/api.ts`) so auth headers are applied.
- Minimize changes and avoid touching vendor code.

Assumptions

- Using AsyncStorage is acceptable for this hybrid app; the project already uses AsyncStorage in `services/api.ts`.
- We will implement simple caching (latest snapshot) rather than a full sync/queue solution.

Plan

1. Edit `src/hooks/useResources.ts` to:
   - read cached resources from AsyncStorage and set state immediately;
   - fetch from network using `api` and update cache on success;
   - update cache when deleting/updating availability.
2. Edit `src/hooks/useComments.ts` to:
   - read cached comments from AsyncStorage per resource id and set state immediately;
   - fetch from network and update cache on success;
   - update cache when submitting a new comment.
3. Run quick smoke checks (static review) — no tests run here.

Validation plan

- Manual inspection of the changed hooks and ensuring TypeScript compiles (not executed here).
- Runtime test: open the app, navigate to resources and comments; cached data should appear instantly, then refresh.

Progress log

- 2025-09-04 15:04 - Created plan and will apply changes to hooks to implement offline-first caching.

Todos

- [ ] Verify app runtime and CI (manual)

Done


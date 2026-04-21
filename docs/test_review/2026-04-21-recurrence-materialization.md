# Test Review

## Target

- Recurrence materialization horizon for recurring schedules
- Month query backfill for open-ended recurring series
- Count-based recurring series generation beyond a fixed two-year window

## Commands

```bash
cd backend
./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleControllerTest"
./gradlew test --tests "com.asterum.scheduler.schedule.*"

cd ../frontend
npm install
npm test -- src/test/CalendarPage.test.tsx src/test/ScheduleFormModal.test.tsx
```

## Passed

- `COUNT` recurrence now materializes the full requested occurrence count even when the interval pushes the last occurrence beyond two years.
- `GET /api/schedules?year=&month=` now materializes missing future occurrences for `NEVER` series when the requested month is beyond the currently stored horizon.
- `GET /api/schedules` does not add extra occurrences when the requested month is already covered by stored occurrences.
- Backend `com.asterum.scheduler.schedule.*` tests passed after the recurrence changes.
- Frontend `ScheduleFormModal.test.tsx` passed in the worktree environment.

## Failed

- Existing frontend baseline issue remains:
  `src/test/CalendarPage.test.tsx` test `converts a one-time schedule into a recurring series from the detail modal` fails because the test calls `user.clear(...)` on the `반복 횟수` field, which is currently rendered as a `select`, not an editable input.

## Risk Analysis

- Month reads now have a write side effect for recurring series that need backfill. This resolves the missing-schedule UX issue, but it changes the previous read-only assumption for uncovered future months.
- Backfill currently scans active recurring series whose `anchorDate` is on or before the requested month end. This is straightforward and safe for current scale, but it may need narrower targeting if the number of recurring series grows significantly.

## Not Covered

- Full frontend suite after dependency installation.
- Non-schedule backend packages.

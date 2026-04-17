# 2026-04-18 Month Read Path And Request Dedupe Test Review

## Scope

- Keep `React.StrictMode` enabled.
- Prevent duplicate initial frontend requests during development/test double-mount.
- Replace month schedule entity traversal with a fixed-query backend read path.
- Preserve existing `/api/schedules?year=&month=` response shape.

## Commands

### Frontend

```bash
/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- App.test.tsx'
/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- App.test.tsx CalendarPage.test.tsx client.test.ts'
/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test'
```

### Backend

```bash
./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleServiceTest.monthReadUsesStableSmallQueryCountEvenWhenOccurrenceCountGrows"
./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleServiceTest" --tests "com.asterum.scheduler.schedule.ScheduleControllerTest"
./gradlew test --tests "com.asterum.scheduler.architecture.BackendArchitectureTest"
./gradlew test
```

## Results

- Frontend targeted test passed after keeping `StrictMode` and adding request cache/invalidation.
- Frontend full suite passed: `6` files, `15` tests.
- Backend month query-count regression test passed after moving month reads to dedicated read queries.
- Backend schedule service/controller targeted tests passed.
- Backend architecture tests passed after moving month response data into an application read model and keeping response mapping in presentation.
- Backend full suite passed.

## Notes

- The default shell `node -v` in this worktree is `v16.15.0`, which is below the frontend engine requirement. Frontend verification therefore used the explicit Node 20.19.0 path above.
- A failed `./gradlew test` run occurred once while two Gradle test commands were executing in parallel against the same `backend` directory. The failure was a test-results file collision, not an application failure. The final `./gradlew test` command was rerun alone and passed.
- The worktree already had unrelated local changes in `backend/src/main/resources/application.yml` and `data/*`. They were left untouched.

## Remaining Risks

- Month read optimization currently applies only to `GET /api/schedules?year=&month=`. `GET /api/schedules/{id}` still uses entity initialization.
- Frontend cache invalidation is intentionally narrow. If new cached GET endpoints are added later, they need explicit invalidation rules.

# Test Review

## Target

- Backend DDD-oriented refactor for the `schedule` module
- Schedule command/query split
- Problem Details error handling and enum-backed error catalog
- Frontend API client Problem Details parsing

## Commands

```bash
cd backend
./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleControllerTest"
./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleServiceTest" --tests "com.asterum.scheduler.schedule.ScheduleControllerTest" --tests "com.asterum.scheduler.architecture.BackendArchitectureTest"
./gradlew test --tests "com.asterum.scheduler.schedule.*" --tests "com.asterum.scheduler.architecture.BackendArchitectureTest"
./gradlew test

cd ../frontend
export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH"
npm install
npm test -- client.test.ts
```

## Passed

- `GET /api/schedules` no longer materializes future occurrences as a read side effect.
- Schedule modules now follow `presentation / application / domain / infrastructure`, and controllers use explicit command/query application services instead of the deleted monolithic `ScheduleService`.
- Architecture tests passed with the new package structure, presentation-to-infrastructure guardrails, and application-to-presentation separation.
- Existing schedule CRUD, recurrence, scoped update/delete, and pessimistic-lock concurrency tests remained green after the service split.
- Backend now returns RFC 9457 Problem Details for bean validation, business rule violations, and not-found errors.
- Backend business errors now carry stable enum-backed codes.
- Frontend API client test passed while preferring Problem Details `detail`.

## Failed

- No final failing tests remained after the refactor.
- Existing baseline issue found before the refactor:
  `ScheduleServiceTest` in the new worktree still expected the old seeded team name `퍼포먼스팀`; current seed data uses `안무팀`. This was corrected before continuing so new regressions could be measured cleanly.

## Risk Analysis

- `SelectionSnapshot` still stores JPA domain objects (`Participant`, `Team`) rather than dedicated snapshot value objects. The architecture is cleaner than before, but aggregate boundaries are not fully isolated yet.
- `RecurringSeriesMaintenanceService` now owns occurrence materialization and conflict checks, but recurrence expansion is still persistence-aware. A stricter domain-service split would require another step.
- Frontend verification was targeted to `client.test.ts`. The API client contract is covered, but full UI integration against Problem Details was not re-run.

## Not Covered

- Full frontend suite under Node 20.
- Controller-level assertions for every individual `ErrorCode`; only representative business, validation, and not-found cases were verified.
- Full separation of presentation DTO enums from domain enums.

## Follow-up

- Introduce dedicated snapshot value objects if the schedule aggregate must stop referencing live `Participant` and `Team` entities.
- Expand frontend tests around screen-level error rendering once Node 20 is guaranteed in the execution environment.
- If error codes become a user-visible contract, document the stable code list explicitly in backend API docs.

# Backend DDD Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the backend so the schedule module follows the repository DDD rules, removes write-on-read behavior, and keeps current schedule features working during the migration.

**Architecture:** Reorganize backend modules around `presentation / application / domain / infrastructure`, split the schedule flow into explicit application command/query services, move recurrence and schedule state changes into domain objects and domain policies, and keep request/response DTOs inside `presentation` only. Preserve the current REST success payloads through the structural refactor; treat the Problem Details migration as a final contract task so frontend updates stay in the same change set.

**Tech Stack:** Java 25, Spring Boot 4 MVC, Spring Data JPA, Bean Validation, H2, JUnit 5, AssertJ, MockMvc, Vitest

---

## Preconditions

- Implement this plan in a dedicated git worktree created from the current branch.
- Do not mix this refactor with the existing local changes in `backend/src/main/java/com/asterum/scheduler/bootstrap/SeedDataInitializer.java`, `backend/src/main/resources/application.yml`, or `data/asterum.mv.db`.
- Keep successful REST response shapes stable during Tasks 1-4.
- If Task 5 is executed, include both backend and frontend changes in the same branch because the error contract changes.

## Current Refactor Inventory

- `GET /api/schedules` performs persistence-side horizon expansion and is not a pure query.
- `backend/src/main/java/com/asterum/scheduler/schedule/service/ScheduleService.java` mixed use-case orchestration, validation, persistence access, domain policy, and response mapping before the refactor.
- `ScheduleSeries` and `ScheduleOccurrence` hold state, but most scheduling rules still live outside the aggregate.
- Schedule logic directly traversed `Team -> TeamMember -> Participant` and built snapshots in the application layer.
- `backend/src/main/java/com/asterum/scheduler/common/exception/GlobalExceptionHandler.java` violates the backend rule that requires Problem Details instead of ad-hoc `Map<String, String>` responses.
- Business and validation errors are currently thrown with hard-coded strings instead of a shared error catalog.

## Target Module Shape

- `backend/src/main/java/com/asterum/scheduler/<module>/presentation`
  - controller, request DTO, response DTO, response assembler
- `backend/src/main/java/com/asterum/scheduler/<module>/application`
  - command/query service, use-case orchestration, transaction boundary
- `backend/src/main/java/com/asterum/scheduler/<module>/domain`
  - entity, value object, domain policy, domain support component
- `backend/src/main/java/com/asterum/scheduler/<module>/infrastructure`
  - persistence adapter, Spring Data repository, external integration
- `backend/src/main/java/com/asterum/scheduler/common/exception`
  - Problem Details mapper, shared exception translation, and enum-based error catalog

## Non-goals

- Do not split JPA entities and persistence models in this branch.
- Do not redesign schedule success DTOs or endpoint URLs.
- Do not add new user-facing schedule features while the refactor is in progress.

### Task 1: Freeze Current Behavior and Add Architecture Guardrails

**Files:**
- Modify: `backend/build.gradle`
- Create: `backend/src/test/java/com/asterum/scheduler/architecture/BackendArchitectureTest.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleControllerTest.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleServiceTest.java`

- [ ] Add an architecture test that enforces `presentation -> application -> domain/infrastructure` flow, blocks presentation-to-infrastructure coupling, and fails when domain depends on presentation packages.
- [ ] Add a characterization test that proves `GET /api/schedules?year=2026&month=8` must not insert new occurrences for a `SeriesEndType.NEVER` series.
- [ ] Add a characterization test that proves create/update/delete/convert still return the same schedule response fields after the later refactor.
- [ ] Run `./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleControllerTest" --tests "com.asterum.scheduler.schedule.ScheduleServiceTest"` from `backend`.
- [ ] Run `./gradlew test --tests "com.asterum.scheduler.architecture.BackendArchitectureTest"` from `backend`.

### Task 2: Separate Query Flow From Write Flow

**Files:**
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleQueryService.java`
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/application/RecurringSeriesMaintenanceService.java`
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/presentation/response/ScheduleResponseAssembler.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/presentation/ScheduleController.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/service/ScheduleService.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/infrastructure/persistence/ScheduleOccurrenceRepository.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleControllerTest.java`

- [ ] Move `get()` and `listMonth()` responsibilities out of `ScheduleService` into `ScheduleQueryService`.
- [ ] Move all `ScheduleResponse` mapping code into `ScheduleResponseAssembler` so application command/query services stop constructing response DTOs inline.
- [ ] Move horizon expansion logic out of `GET /api/schedules` into `RecurringSeriesMaintenanceService`.
- [ ] Trigger horizon expansion only from explicit write flows in this branch: create recurring schedule, convert to series, update series scope, delete series scope.
- [ ] Keep `ScheduleController` using query service for `GET` endpoints and command service for mutation endpoints.
- [ ] Run `./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleControllerTest"` from `backend`.

### Task 3: Replace the Monolithic ScheduleService With Application Services

**Files:**
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleCommandService.java`
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/application/SelectionSnapshotResolver.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/presentation/ScheduleController.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/service/ScheduleService.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleServiceTest.java`

- [ ] Move `create`, `convertToSeries`, `update`, and `delete` into `ScheduleCommandService`.
- [ ] Extract participant/team/resource resolution and participant snapshot assembly into `SelectionSnapshotResolver`.
- [ ] Reduce the old `ScheduleService` to a compatibility wrapper during the migration, then delete it once controller wiring and tests pass.
- [ ] Keep repository access inside application services; do not let controllers or domain objects reach into repositories directly.
- [ ] Run `./gradlew test --tests "com.asterum.scheduler.schedule.ScheduleServiceTest"` from `backend`.
- [ ] Run full backend verification with `./gradlew test` from `backend`.

### Task 4: Move Scheduling Rules Into Domain Objects and Domain Policies

**Files:**
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/domain/RecurrenceSpec.java`
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/domain/SelectionSnapshot.java`
- Create: `backend/src/main/java/com/asterum/scheduler/schedule/domain/ResourceConflictPolicy.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/domain/ScheduleSeries.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/domain/ScheduleOccurrence.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/domain/RecurrenceGenerator.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleCommandService.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/RecurrenceGeneratorTest.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleServiceTest.java`

- [ ] Introduce `RecurrenceSpec` as the domain representation of recurrence rules so application code no longer passes `RecurrenceRequest` into domain-facing logic.
- [ ] Introduce `SelectionSnapshot` so schedule aggregates stop depending on live `Team` traversal to reconstruct participant membership.
- [ ] Move time-range validation, exception marking, series closing, deactivation, and recurring update semantics into domain methods on `ScheduleSeries` and `ScheduleOccurrence`.
- [ ] Move resource collision checks behind `ResourceConflictPolicy`; the application layer may coordinate the lookup, but the policy rule must not stay embedded in a large service method.
- [ ] Keep `RecurrenceGenerator` as a domain-support component and update its API to accept domain input instead of transport DTO fragments.
- [ ] Run `./gradlew test --tests "com.asterum.scheduler.schedule.RecurrenceGeneratorTest" --tests "com.asterum.scheduler.schedule.ScheduleServiceTest"` from `backend`.

### Task 5: Migrate Error Handling to Problem Details and Update Frontend Consumer

**Files:**
- Create: `backend/src/main/java/com/asterum/scheduler/common/exception/ErrorCode.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/common/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/common/exception/BadRequestException.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/common/exception/NotFoundException.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleCommandService.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleQueryService.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/domain/ResourceConflictPolicy.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/participant/ParticipantControllerTest.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleControllerTest.java`
- Modify: `backend/src/test/java/com/asterum/scheduler/schedule/ScheduleServiceTest.java`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/test/client.test.ts`
- Modify: `frontend/src/features/calendar/useCalendarState.ts`

- [ ] Replace ad-hoc map responses with RFC 9457 Problem Details responses that populate `type`, `title`, `status`, `detail`, and `instance`.
- [ ] Introduce `ErrorCode` enum that owns stable error identifiers, default titles, and user-facing detail messages for backend business errors.
- [ ] Change custom exceptions to carry `ErrorCode` instead of raw hard-coded strings so service and domain code stop embedding error message literals.
- [ ] Keep backend exception messages sanitized so implementation details are not leaked into API responses.
- [ ] Replace the current hard-coded schedule error strings such as missing resource, invalid recurrence, duplicate conversion, and collision failures with enum-backed exception creation.
- [ ] Update frontend API error parsing to prefer Problem Details `detail` and remain backward-compatible with legacy `message` during the migration window.
- [ ] Add backend tests that assert validation and business exceptions now return Problem Details fields and stable enum-backed error codes.
- [ ] Add frontend tests that assert `api/client.ts` surfaces the `detail` field when the backend returns Problem Details.
- [ ] Run `./gradlew test` from `backend`.
- [ ] Run `npm test -- client.test.ts` from `frontend`.

### Task 6: Final Verification, Cleanup, and Review Notes

**Files:**
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/presentation/ScheduleController.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleCommandService.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/application/ScheduleQueryService.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/presentation/response/ScheduleResponseAssembler.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/application/RecurringSeriesMaintenanceService.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/domain/ScheduleSeries.java`
- Modify: `backend/src/main/java/com/asterum/scheduler/schedule/domain/ScheduleOccurrence.java`
- Create: `docs/test_review/2026-04-17-backend-ddd-refactor.md`

- [ ] Remove dead code left by the migration, especially the old `ScheduleService` wrapper if controllers no longer depend on it.
- [ ] Re-run the narrow backend tests for schedule, participant, and architecture coverage.
- [ ] Re-run the full backend suite with `./gradlew test` from `backend`.
- [ ] Re-run the targeted frontend API test with `npm test -- client.test.ts` from `frontend`.
- [ ] Write `docs/test_review/2026-04-17-backend-ddd-refactor.md` with commands, passed checks, remaining risks, and any deliberately deferred refactor items.

## Recommended Execution Order

1. Task 1 and Task 2 in the first branch slice.
2. Task 3 after query/write separation is stable.
3. Task 4 only after command/query tests are green.
4. Task 5 only when frontend updates can ship in the same change set.
5. Task 6 immediately before review or merge.

## Risk Notes

- The highest regression risk is recurring schedule expansion for `SeriesEndType.NEVER`; keep characterization tests around that flow until the branch is merged.
- The second risk is accidental API drift while moving response assembly; preserve current success payload fields until Problem Details migration starts.
- Enum-backed error messages must stay stable once introduced; changing enum detail text later becomes an API contract change if the frontend surfaces it directly.
- Avoid refactoring `team`, `participant`, and `resource` modules into separate architectural styles in the same branch; focus this branch on `schedule` boundaries first.

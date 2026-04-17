# Month Read Path And Request Dedupe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `React.StrictMode`, prevent duplicate initial network requests in the frontend, and replace the month schedule endpoint with a fixed-query read model while preserving the current response shape.

**Architecture:** The frontend keeps its current calendar flow but moves initial lookup/month fetches behind a small request-deduping cache so duplicate mounts reuse the same in-flight promise. The backend splits `GET /api/schedules?year=&month=` away from entity graph traversal and assembles `ScheduleResponse` from month-specific read queries that do not walk lazy relations.

**Tech Stack:** React 19 + Vite + Vitest, Spring Boot 4 MVC, Spring Data JPA, Hibernate, H2, JUnit 5, MockMvc

---

## Scope

- Keep `frontend/src/main.tsx` wrapped in `StrictMode`.
- Deduplicate initial `participants`, `teams`, `resources`, and month schedule requests in the frontend.
- Replace month schedule entity initialization with a backend read-model path.
- Preserve `/api/schedules`, `/api/participants`, `/api/teams`, `/api/resources` response contracts.
- Do not optimize `GET /api/schedules/{id}` in this change.

## Files Expected To Change

- `frontend/src/api/*.ts`
- `frontend/src/features/calendar/useCalendarState.ts`
- `frontend/src/main.tsx`
- `frontend/src/test/App.test.tsx`
- `frontend/src/test/CalendarPage.test.tsx`
- `backend/src/main/java/com/asterum/scheduler/schedule/application/*`
- `backend/src/main/java/com/asterum/scheduler/schedule/infrastructure/persistence/*`
- `backend/src/main/java/com/asterum/scheduler/schedule/presentation/*`
- `backend/src/test/java/com/asterum/scheduler/schedule/*`
- `docs/test_review/2026-04-18-month-read-path-dedupe.md`

## TDD Order

1. Add failing frontend tests that render under `StrictMode` and prove the first mount triggers only four network calls total.
2. Add failing backend tests that prove month query count does not grow with more occurrences and that the schedule response shape is unchanged.
3. Implement the minimal frontend dedupe/cache needed for the tests.
4. Implement the backend month read-model query path and direct `ScheduleResponse` assembly.
5. Run targeted verification, then write the test review note with observed commands and remaining risks.

## Risks

- Shared frontend cache must not break month navigation or stale response guards.
- Backend read queries must preserve sorting for occurrences, participants, teams, and team members.
- The worktree already contains unrelated local changes in `backend/src/main/resources/application.yml` and `data/*`; do not overwrite them.

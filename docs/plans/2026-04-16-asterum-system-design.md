# Asterum System Design

## Scope

Build the MVP of the Asterum integrated scheduler in a single repository at `D:\Repository\asterum-system`.

The MVP includes:
- One-time schedule CRUD
- Recurring schedule creation and monthly expansion
- Participant selection using seeded `MEMBER` and `STAFF` data
- Scoped recurring update and delete using `THIS`, `FOLLOWING`, and `ALL`
- H2-backed persistence for local evaluator-friendly execution

The MVP excludes:
- Team-based participants
- One-time schedule to recurring conversion
- Location/resource booking
- Concurrency control for location/resource reservation

## Repository Layout

- `backend/`: Spring Boot backend
- `frontend/`: React frontend
- `docs/implementation_plan.md`: working implementation plan
- `.agents/docs/`, `.claude/docs/`: ignored reference document copies

## Backend Design

- `ScheduleSeries` stores recurrence pattern metadata.
- `ScheduleOccurrence` stores actual calendar-visible schedule instances.
- `Participant` stores people as a single model with type `MEMBER` or `STAFF`.
- `ScheduleOccurrenceParticipant` links occurrences to participants.
- One-time schedules use an occurrence without a series.
- Single-occurrence delete uses cancellation status instead of hard delete.

## Frontend Design

- Monthly calendar page is the main entry.
- Clicking a day opens create flow.
- Clicking a schedule opens detail/edit/delete flow.
- Recurring edits and deletes require explicit scope choice.
- Participant labels show both name and type.

## Persistence and Demo Policy

- H2 file mode is used so the evaluator can run the project without external DB setup.
- Initial participant data is seeded on first boot.
- The structure remains compatible with later participant CRUD expansion.

## Future Extension Notes

- Location/resource booking is intentionally excluded from MVP.
- If that feature is added later, same-timeslot collision prevention, race conditions, and DB locking or optimistic locking must be designed explicitly.

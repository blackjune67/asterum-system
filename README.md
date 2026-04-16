# Asterum System

Integrated scheduler MVP for one-time and recurring production schedules.

## Stack

- Backend: Spring Boot 4.0.5, Java 25, H2 file mode
- Frontend: React, TypeScript, Vite, Tailwind CSS

## Docs

- Main implementation plan: `docs/implementation_plan.md`
- Agent/assistant reference copies:
  - `.agents/docs/`
  - `.claude/docs/`

## Run

### Backend

```bash
cd backend
set JAVA_HOME=C:\Program Files\Microsoft\jdk-25.0.2.10-hotspot
gradlew.bat bootRun
```

The backend starts on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Notes

- Participant data is seeded on first backend startup.
- Schedule data persists in H2 file mode under `backend/data/`.
- Feature-by-feature AI work notes should be stored under `docs/ai-notes/`.

## Status

Project scaffolding and MVP implementation are in progress.

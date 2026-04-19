# Asterum Frontend

React 19 + TypeScript + Vite frontend for the Asterum scheduler UI.

## Requirements

- Node.js `20.19.0+` or `22.12.0+`
- npm `10+` recommended

`vite@8` and `vitest@4` do not run on Node 16. If `npm run build` or `npm test` fails with Node runtime errors, upgrade Node first.

## Scripts

- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

## Notes

- The calendar screen fetches monthly schedules and participants from `/api`.
- Local development proxies `/api` requests to `http://localhost:8083`.
- Server state and cache stay in React Query.
- UI flow state such as selected dates, modal visibility, and pending recurring edits live in Zustand feature stores.
- Ephemeral form field input stays local to each modal unless multiple screens need to share it.

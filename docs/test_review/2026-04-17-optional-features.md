# 2026-04-17 Optional Features Test Review

## Scope
- 단건 일정 -> 반복 시리즈 전환
- 팀 단위 참여자 지정
- 리소스 지정 및 시간 중복 방지

## Backend
- Command: `./gradlew test`
- Result: PASS
- Notes:
  - `ScheduleServiceTest`에 팀 snapshot, 리소스 충돌, 반복 전환 검증 포함
  - `ScheduleControllerTest`에 반복 전환 API 흐름 검증 포함

## Frontend
- Command: `PATH=/Users/june/.nvm/versions/node/v24.12.0/bin:$PATH npm test`
- Result: PASS
- Notes:
  - `CalendarPage.test.tsx`에서 반복 전환, 삭제 scope, stale month response 검증
  - `ScheduleFormModal.test.tsx`와 `MonthGrid.test.tsx`는 계약 확장 후에도 유지

- Command: `PATH=/Users/june/.nvm/versions/node/v24.12.0/bin:$PATH npm run build`
- Result: PASS
- Notes:
  - `vite` 빌드는 통과
  - 번들 경고: main chunk가 500 kB를 초과함. 기능 검증에는 영향 없지만 추후 code-splitting 검토 가능

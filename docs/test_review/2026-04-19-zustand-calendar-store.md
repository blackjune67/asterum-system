# Test Review

## Target

- 캘린더 화면의 UI 상태를 Zustand store로 분리
- React Query는 서버 상태 전용으로 유지
- 대상 파일: `frontend/src/features/calendar/*`, `frontend/src/test/calendarUiStore.test.ts`, `frontend/src/test/setup.ts`, `frontend/README.md`

## Commands

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/calendarUiStore.test.ts
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/calendarUiStore.test.ts src/test/CalendarPage.test.tsx
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm run build
```

## Passed

- 새 store 단위 테스트 `src/test/calendarUiStore.test.ts` 4건이 통과했다.
- `CalendarPage` 통합 테스트를 포함한 프런트 전체 테스트 20건이 모두 통과했다.
- 프런트 프로덕션 빌드가 성공했다.

## Failed

- 실패한 테스트는 없었다.
- 빌드 시 메인 번들 크기 경고는 남아 있다.
  - `dist/assets/index-k42wNjbN.js` 가 500 kB 기준을 초과했다.
  - 이번 작업의 회귀는 아니지만, 이후 코드 스플리팅 검토 대상이다.

## Risk Analysis

- 캘린더 UI 상태가 singleton store로 이동했기 때문에 테스트 간 상태 누수 방지를 위해 `src/test/setup.ts` 에서 store reset을 강제했다.
- 서버 데이터는 계속 React Query가 소유하므로 API 캐시 무효화 동작은 기존과 동일하다.
- 반복 일정 수정/삭제 흐름은 store의 `pendingUpdate` 와 `scopeMode` 로 유지되므로, 관련 회귀는 기존 통합 테스트와 새 store 테스트로 함께 방어한다.

## Not Covered

- 백엔드 검증은 수행하지 않았다. 이번 변경은 프런트 상태 구조 리팩터링으로 API 계약 변경이 없다.
- 번들 경고 해소를 위한 코드 스플리팅은 이번 변경 범위에 포함하지 않았다.

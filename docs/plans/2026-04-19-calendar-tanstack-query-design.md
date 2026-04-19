# Calendar TanStack Query Design

## Goal

- 캘린더 화면의 서버 상태를 `@tanstack/react-query`로 관리한다.
- 월별 일정 조회, 상세 조회, lookup 조회를 `useQuery`로 분리한다.
- 생성/수정/삭제/반복 전환 후 월별 일정 캐시를 invalidation으로 갱신한다.

## Scope

- `frontend/src/main.tsx`에 `QueryClientProvider`를 추가한다.
- `frontend/src/features/calendar/useCalendarState.ts`에서 직접 fetch lifecycle 관리 코드를 제거한다.
- 캘린더 전용 query key를 추가해 일정 월 조회와 상세 조회, lookup 조회를 안정적으로 구분한다.
- mutation 성공 후 월별 일정 쿼리를 무효화하고, 상세 화면은 필요한 경우 query cache를 직접 보정한다.

## Non-Goals

- 프런트 전체의 수제 API 캐시 제거는 이번 변경 범위에 포함하지 않는다.
- 캘린더 외 기능으로 `react-query` 사용 범위를 확장하지 않는다.

## Risks

- 기존 테스트는 provider 없이 렌더링하므로 query client 래퍼가 필요하다.
- 상세 조회는 기존에 “성공 시에만 모달 오픈” 동작을 갖고 있으므로 상태 전이 회귀를 조심해야 한다.

## Verification

- 캘린더 페이지 테스트를 query provider 기준으로 갱신한다.
- 프런트 `vitest`와 `build`를 실행한다.
- 결과는 `docs/test_review/`에 기록한다.

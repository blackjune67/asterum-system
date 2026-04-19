# 2026-04-19 Weekly Timeline View

## 변경 요약
- 달력 화면에 `월간 | 주간` 토글을 추가했다.
- 주간 뷰는 선택 날짜 기준 월요일 시작 타임라인으로 렌더링된다.
- 리소스별 행과 `리소스 미지정` 행을 지원한다.
- 주간 범위가 월 경계를 넘으면 인접 월 데이터를 추가 조회한다.

## 실행한 검증
- `frontend`: `npm test -- --run src/test/weekTimeline.test.ts src/test/calendarUiStore.test.ts src/test/CalendarPage.test.tsx`
- `frontend`: `npm test`
- `frontend`: `npm run build`
- `backend`: `./gradlew test`

## 결과
- 프런트 타깃 테스트 통과
- 프런트 전체 테스트 통과
- 프런트 프로덕션 빌드 통과
- 백엔드 전체 테스트 통과

## 메모
- `vite build`에서 번들 크기 500 kB 초과 경고가 출력되었지만 빌드는 성공했다.
- 이번 변경은 프런트 중심 기능 추가이며 백엔드 계약 변경은 없다.

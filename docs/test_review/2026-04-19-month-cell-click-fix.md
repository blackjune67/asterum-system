# 2026-04-19 Month Cell Click Fix

## 변경 요약

- `frontend/src/features/calendar/MonthGrid.tsx`
  - 일정이 없는 날짜 셀만 등록 모달 트리거로 동작하도록 조정
  - 일정이 있는 날짜 셀의 흰 배경 클릭은 더 이상 등록 모달을 열지 않도록 변경
- `frontend/src/test/CalendarPage.test.tsx`
  - 일정이 있는 날짜 셀의 빈 영역 클릭이 등록 모달을 열지 않는 회귀 테스트 추가

## 수행한 검증

1. 대상 회귀 테스트
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/CalendarPage.test.tsx -t "does not open the create modal when clicking empty space on a day with schedules"'`
   - 결과: 성공
   - 근거: `Tests  1 passed | 10 skipped (11)`

2. 기존 동작 유지 확인
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/CalendarPage.test.tsx -t "opens the create modal from a calendar day selection"'`
   - 결과: 성공
   - 근거: `Tests  1 passed | 10 skipped (11)`

3. 월간 그리드 단위 테스트
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/MonthGrid.test.tsx'`
   - 결과: 성공
   - 근거: `Tests  1 passed (1)`

4. 프런트 빌드
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm run build'`
   - 결과: 성공
   - 근거: `✓ built in 2.09s`

## 기존 실패와 분리 기록

- 전체 `src/test/CalendarPage.test.tsx`를 실행하면 `converts a one-time schedule into a recurring series from the detail modal` 테스트가 여전히 실패한다.
- 실패 내용: `user.clear()`가 `select` 요소에 호출되어 `clear() is only supported on editable elements` 오류가 발생한다.
- 판단: 이번 월간 셀 클릭 버그와는 별개의 기존 테스트 코드 문제로 보이며, 이번 수정에서는 건드리지 않았다.

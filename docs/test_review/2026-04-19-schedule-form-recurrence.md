# 2026-04-19 Schedule Form Recurrence Review

## 변경 요약

- `frontend/src/features/schedule/ScheduleFormModal.tsx`
  - 반복 기본값을 `매일`로 변경
  - `간격` 라벨을 `반복`으로 변경
  - 반복 유형별 옵션을 `1~99` 범위의 `일/주/개월` 선택지로 변경
  - 종료 조건 `횟수` 입력값을 `50` 이하로 제한
- `frontend/src/test/ScheduleFormModal.test.tsx`
  - 반복 기본값, 반복 옵션 노출, 반복 횟수 상한 테스트 추가

## 수행한 검증

1. 대상 테스트
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/ScheduleFormModal.test.tsx'`
   - 결과: 성공
   - 근거: `1 passed`, `9 passed`

2. 프런트 빌드
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm run build'`
   - 결과: 성공
   - 근거: `tsc -b && vite build` 완료, 산출물 생성 확인

## 기존 실패와 분리 기록

1. 전체 프런트 테스트
   - 명령: `/bin/zsh -lc 'export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test'`
   - 결과: 실패
   - 실패 위치: `frontend/src/test/App.test.tsx`
   - 실패 내용: `PLAYBOOK EDITION` 텍스트를 찾지 못해 테스트 실패
   - 판단: 이번 반복일정 수정과 직접 관련 없는 기존 테스트 기대값 불일치로 보임

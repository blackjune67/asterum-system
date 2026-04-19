# 2026-04-19 Recurrence Interval Label Clarity

## 변경 요약

- `frontend/src/features/schedule/ScheduleFormModal.tsx`
  - 반복 필드 라벨을 `반복`에서 `반복 간격`으로 변경
  - 반복 간격 옵션을 `1일마다 / 1주마다 / 1개월마다` 형태로 변경
  - `리소스` 표기를 `장소`로 변경
- `frontend/src/features/schedule/ScheduleDetailModal.tsx`
  - 상세 모달의 `리소스` 라벨을 `장소`로 변경
- `frontend/src/features/calendar/weekTimeline.ts`
  - `리소스 미지정` 표기를 `장소 미지정`으로 변경
- `frontend/src/test/ScheduleFormModal.test.tsx`
  - 반복 간격 라벨과 옵션 문구가 의도대로 표시되는지 검증하도록 테스트 갱신
- `frontend/src/test/CalendarPage.test.tsx`
  - 장소 라벨 기대값으로 갱신
- `frontend/src/test/weekTimeline.test.ts`
  - 장소 미지정 라벨 기대값으로 갱신

## 수행한 검증

- 사용자 요청에 따라 이번 최종 변경본에 대해서는 테스트와 빌드를 실행하지 않았다.

## 기존 실패와 분리 기록

- 백엔드 검증은 이번 변경이 프런트 표시 문구와 테스트 기대값에 한정되어 있어 수행하지 않았다.
- 테스트 미실행 상태이므로 기존 실패와 신규 실패를 구분할 실행 근거는 이번 턴에 없다.

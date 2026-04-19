# 2026-04-19 참여자 섹션 분리 검증

## 변경 요약

- `ScheduleFormModal`의 참여자 선택 UI에서 `MEMBER`와 `STAFF`를 각각 `아티스트`, `스태프` 섹션으로 분리했다.
- 분리 렌더링을 검증하는 프런트 테스트를 추가했다.

## 실행한 검증

### 프런트엔드

1. `cd frontend && PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" npm test -- ScheduleFormModal`
   - 결과: 통과
   - 세부: `1`개 파일, `4`개 테스트 통과
2. `cd frontend && PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" npm test`
   - 결과: 통과
   - 세부: `6`개 파일, `16`개 테스트 통과
3. `cd frontend && PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" npm run build`
   - 결과: 통과
   - 비고: Vite의 번들 크기 경고가 출력됐지만 이번 변경과 직접 관련된 실패는 없었다.

### 백엔드

1. `cd backend && ./gradlew test`
   - 결과: 통과
   - 세부: `BUILD SUCCESSFUL`

## 기존 실패 여부

- 이번 검증 범위에서 확인된 기존 실패는 없었다.

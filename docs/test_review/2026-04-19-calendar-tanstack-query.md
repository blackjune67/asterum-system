# Test Review

## Target

- 캘린더 화면의 `@tanstack/react-query` 도입
- 월별 일정 조회, 상세 조회, lookup 조회의 query 전환
- 생성/수정/삭제/반복 전환 후 mutation invalidation 정리

## Commands

- `export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test`
- `export PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH" && npm run build`

## Passed

- `vitest` 6개 파일, 15개 테스트 통과
- 캘린더 월 전환 중 늦게 도착한 이전 요청이 최신 월 데이터를 덮지 않는 회귀 테스트 통과
- 상세 조회 실패 시 에러 메시지 표시 테스트 통과
- 반복 일정 삭제 범위 선택, 단일 일정의 반복 전환 흐름 테스트 통과
- 프로덕션 빌드 성공

## Failed

- 새 코드로 인한 테스트 실패는 없음
- 초기 한 차례 `vitest` 실행은 Node 16으로 설치된 optional dependency 누락 때문에 실패했고, Node 20 경로로 `npm install` 재실행 후 해결됨

## Risk Analysis

- `react-query` 캐시는 캘린더 기능 범위에만 적용했고, mutation 후에는 월별 일정 query prefix invalidation으로 정합성을 맞췄다
- 반복 일정 수정은 현재 보이는 월 외의 캐시를 모두 무효화하므로 현재 UI 기준에서는 안전하지만, 향후 다른 화면이 같은 schedule query를 공유하면 invalidation 범위를 다시 세분화할 필요가 있다
- 상세 조회는 “성공 시 모달 오픈” 동작을 유지하기 위해 별도 `detailRequested` 상태를 두었고, 이 부분이 상세/편집/전환 흐름 회귀의 핵심 지점이다
- 빌드 자체는 성공했지만 번들 경고로 메인 JS 청크가 500 kB를 넘는다

## Not Covered

- 실제 브라우저에서의 포커스 복귀, 모달 전환 체감, 네트워크 지연 시 로딩 UX는 수동 확인하지 못했다
- create/edit/delete 실패 시 서버별 세부 메시지 표현은 단위 테스트로 추가 검증하지 않았다
- 캘린더 외 화면에 `react-query`를 확장했을 때의 query key 충돌 여부는 이번 범위 밖이다

## Follow-up

- 프런트 실행 환경을 Node 20으로 고정하는 방법을 문서나 툴링에 반영하는 것이 안전하다
- 필요하면 `CalendarPage`와 모달을 동적 분리해 번들 경고를 줄일 수 있다

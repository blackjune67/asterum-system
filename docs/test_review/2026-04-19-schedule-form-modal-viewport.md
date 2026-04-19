# Test Review

## Target

- 일정 등록/수정 모달이 현재 뷰포트보다 커질 때 하단이 잘리던 문제 수정
- 대상 파일: `frontend/src/features/schedule/ScheduleFormModal.tsx`, `frontend/src/test/ScheduleFormModal.test.tsx`

## Commands

```bash
cd frontend && npm test
cd frontend && npm run build
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && node -v && npm test
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && node -v && npm run build
```

## Passed

- `ScheduleFormModal`에 `max-h-[calc(100dvh-2rem)] overflow-y-auto`를 적용해 모달이 뷰포트 안에 머무르고 내부 스크롤이 가능하도록 수정했다.
- 회귀 방지 테스트 1건을 추가한 뒤 프런트 전체 테스트 `7 files, 21 tests`가 통과했다.
- 프런트 프로덕션 빌드가 성공했다.

## Failed

- 기본 셸 환경의 Node.js가 `v16.15.0`이라 첫 번째 `npm test`, `npm run build`는 도구 체인 요구사항(`>=20.19.0`) 때문에 실패했다.
- 위 실패는 코드 변경 때문이 아니라 로컬 실행 환경 문제이며, Node `v20.19.0` 경로를 명시한 재실행에서는 동일 명령이 모두 성공했다.
- 이번 변경으로 생긴 신규 테스트 실패나 빌드 실패는 확인되지 않았다.

## Risk Analysis

- 수정 범위를 `ScheduleFormModal` 컴포넌트로 한정해 다른 모달의 레이아웃 변화는 피했다.
- 내부 스크롤 방식이므로 작은 높이의 화면에서도 액션 버튼까지 접근 가능하다.
- 실제 브라우저 수동 확인은 수행하지 않았으므로, 아주 낮은 뷰포트에서 헤더/푸터 체감은 추후 시각 검증이 남아 있다.

## Not Covered

- 백엔드 검증은 수행하지 않았다. 이번 변경은 프런트 모달 레이아웃에만 한정된다.
- 실제 브라우저에서의 픽셀 단위 시각 검증이나 스크린샷 비교는 수행하지 않았다.

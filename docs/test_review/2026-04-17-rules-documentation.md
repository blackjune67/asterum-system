# Test Review

## Target

- 규칙 문서 추가
- 대상 파일: `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md`, `docs/rules/README.md`, `docs/test_review/README.md`, `README.md`

## Commands

```bash
cd backend && ./gradlew test
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test
```

## Passed

- 백엔드 테스트 스위트는 전체 통과했다.
- 문서 변경 자체가 백엔드 실행 경로나 테스트 설정을 깨뜨리지는 않았다.

## Failed

- 프런트 테스트는 기존 실패 3건이 그대로 남아 있다.
- 실패 항목:
  - `CalendarPage > keeps the latest month data when an earlier request resolves late`
  - `CalendarPage > shows a detail error when loading the selected item fails`
  - `CalendarPage > asks for a delete scope when removing a recurring schedule`
- 첫 번째 프런트 실행 실패는 Node 16 기반 설치로 인한 optional native binding 누락이었다.
- Node 20 경로로 재설치 후에는 테스트 러너가 정상 기동했고, 위 3건만 남았다.

## Risk Analysis

- 이번 변경은 문서와 규칙 정의만 포함하므로 런타임 동작을 직접 변경하지 않는다.
- 다만 프런트 테스트가 이미 깨져 있으므로 이후 기능 작업에서는 현재 실패와 신규 실패를 반드시 분리해야 한다.
- 백엔드의 RFC 9457, DTO-only, no-Map 규칙은 아직 정책 문서화 단계이며 코드베이스 전체 적용은 후속 작업이 필요하다.

## Not Covered

- 프런트 빌드 검증은 수행하지 않았다.
- 백엔드 API 응답이 실제로 RFC 9457로 통일되었는지는 아직 검증 대상이 아니다.
- AGENTS 규칙 준수 여부를 강제하는 자동화 체크는 아직 없다.

## Follow-up

- 백엔드 공통 예외 응답을 RFC 9457 Problem Details 모델로 마이그레이션한다.
- 프런트 API 클라이언트에 Problem Details 파서를 도입한다.
- 프런트의 기존 실패 3건을 별도 작업으로 정리하고 기준선을 회복한다.

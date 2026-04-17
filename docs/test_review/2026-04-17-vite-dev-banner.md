# Test Review

## Target

- Vite 개발 서버 시작 시 커스텀 배너 출력 추가
- 대상 파일: `frontend/vite.config.ts`, `frontend/src/devBannerPlugin.ts`, `frontend/src/test/devBannerPlugin.test.ts`

## Commands

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test -- src/test/devBannerPlugin.test.ts
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm test
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm run build
cd frontend && export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH" && npm run dev -- --host 127.0.0.1 --clearScreen false
```

## Passed

- 새 테스트 `src/test/devBannerPlugin.test.ts` 2건이 통과했다.
- 프런트 프로덕션 빌드가 성공했다.
- 실제 `npm run dev` 실행 시 아래 배너가 Vite 준비 로그보다 먼저 출력되는 것을 확인했다.

```text
+----------------------+
| ASTERUM-SYSTEM-FRONT |
+----------------------+
```

## Failed

- 프런트 전체 테스트에는 기존 실패 3건이 그대로 남아 있다.
- 기존 실패 항목:
  - `CalendarPage > keeps the latest month data when an earlier request resolves late`
  - `CalendarPage > shows a detail error when loading the selected item fails`
  - `CalendarPage > asks for a delete scope when removing a recurring schedule`
- 이번 변경과 직접 관련된 신규 실패는 확인되지 않았다.

## Risk Analysis

- 배너 출력은 `serve` 전용 Vite 플러그인으로 제한돼 있어 빌드 산출물에는 영향을 주지 않는다.
- 출력은 Vite logger를 통해 수행하므로 표준 Vite 콘솔 흐름과 충돌 가능성은 낮다.
- 다만 전체 프런트 테스트 기준선이 이미 깨져 있어 이후 기능 작업에서도 신규 실패와 기존 실패를 계속 분리해서 봐야 한다.

## Not Covered

- 백엔드 검증은 수행하지 않았다. 이번 변경은 프런트 개발 서버 출력에만 한정돼 있어 영향 범위 밖으로 판단했다.
- 다른 포트나 middleware mode에서의 배너 출력은 별도 검증하지 않았다.

## Follow-up

- 필요하면 배너에 환경명이나 프록시 대상 정보까지 포함하도록 확장할 수 있다.
- 기존 `CalendarPage` 테스트 실패 3건은 별도 작업으로 기준선을 회복하는 편이 좋다.

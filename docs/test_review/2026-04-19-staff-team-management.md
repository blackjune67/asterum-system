# 2026-04-19 Staff Team Management

## Summary
- 개인 스태프/팀 CRUD 백엔드 API를 추가했다.
- 시드 데이터를 아티스트 + 팀 소속 개인 스태프 구조로 재구성했다.
- 프런트에 참가자/팀 관리 모달을 추가하고, 스케줄 폼에서 개인 스태프와 소속 팀을 함께 표시하도록 변경했다.

## Verification
- Backend: `./gradlew test`
  - 결과: PASS
- Frontend: `npm test`
  - 실행 환경: `PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH"`
  - 결과: PASS
- Frontend: `npm run build`
  - 실행 환경: `PATH="/Users/june/.nvm/versions/node/v20.19.0/bin:$PATH"`
  - 결과: PASS

## Notes
- 프런트 빌드는 번들 크기 경고를 출력했지만 실패는 아니며, 이번 기능 범위의 회귀와는 무관했다.

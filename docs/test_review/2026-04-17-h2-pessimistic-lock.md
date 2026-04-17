# 2026-04-17 H2 Pessimistic Lock Test Review

## Scope
- H2 파일 DB 환경에서 리소스 예약 충돌에 대한 비관적 락 적용
- 단일 스프링부트 인스턴스 내 동시 요청 직렬화 보장 확인

## Backend
- Command: `./gradlew test --tests com.asterum.scheduler.schedule.ScheduleConcurrencyTest`
- Result: PASS
- Notes:
  - 첫 번째 트랜잭션이 `Resource` 행을 `PESSIMISTIC_WRITE` 로 점유하는 동안
  - 두 번째 요청이 대기했다가
  - 첫 번째 트랜잭션 커밋 후 `Resource collision` 로 실패하는 시나리오 검증

- Command: `./gradlew test`
- Result: PASS
- Notes:
  - 기존 스케줄 CRUD, 반복 일정, 팀/리소스 기능과 충돌 없이 통과

## Frontend
- Result: Not run
- Notes:
  - 이번 변경은 backend 동시성 제어에만 한정됨

# Backend Rules

이 문서는 `backend/` 전체에 적용된다.

상세 설명과 예시는 `../docs/rules/README.md`를 따른다.

## API 계약

1. 요청/응답 본문에 `Map`, `Object`, 익명 JSON 구조를 사용하지 않는다.
2. `presentation` 계층은 명시적인 request/response DTO만 노출한다.
3. JPA 엔티티를 API 응답으로 직접 반환하지 않는다.
4. API 입력 검증은 `presentation` 경계에서 수행하고, 핵심 도메인 제약은 `application`/`domain` 계층에서 다시 보장한다.

## 레이어 및 설계

1. DDD 아키텍처와 SOLID 원칙을 기준으로 설계한다.
2. 도메인 모듈 패키지 기본 구조는 `presentation / application / domain / infrastructure`를 사용한다.
3. `presentation`은 transport concern, request/response mapping, validation entry만 담당하고 비즈니스 규칙을 넣지 않는다.
4. `application`은 유스케이스와 트랜잭션 경계를 담당한다.
5. `domain`은 핵심 규칙과 상태 전이를 표현한다.
6. `infrastructure`는 영속성, 프레임워크 연동, 외부 시스템 연결을 담당한다.
7. `infrastructure.persistence`의 리포지토리는 영속성 처리만 담당하며 정책 판단을 넣지 않는다.

## 에러 규칙

1. 에러 응답은 RFC 9457 Problem Details 형태를 표준으로 사용한다.
2. 기본 필드는 `type`, `title`, `status`, `detail`, `instance`를 사용한다.
3. 확장 필드는 표준화된 경우에만 추가하며 예시는 `code`, `errors`, `timestamp`, `traceId`다.
4. 전역 예외 처리 전략으로 응답 형태를 일관되게 유지한다.
5. 운영 응답에 내부 예외 메시지나 스택 트레이스를 노출하지 않는다.

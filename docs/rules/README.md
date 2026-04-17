# Asterum System Rule Index

이 문서는 프로젝트 규칙의 인덱스이자 상세 설명 문서다. 강제 적용 범위는 각 디렉터리의 `AGENTS.md`를 따른다.

## 1. 문서 구조

- 전역 규칙: `/AGENTS.md`
- 백엔드 규칙: `backend/AGENTS.md`
- 프런트 규칙: `frontend/AGENTS.md`
- 테스트 리뷰 문서 규칙: `docs/test_review/README.md`

## 2. 전역 규칙

### Worktree

- 새로운 기능 구현은 반드시 worktree에서 시작한다.
- 기준 브랜치는 현재 작업 중인 브랜치다.
- 표준 위치는 프로젝트 루트 `.worktrees/`다.
- 권장 이름은 `.worktrees/<base-branch>-<task-slug>` 형태다.
- 문서만 수정하는 경미한 작업이 아니라면 기본 작업 트리에서 직접 기능 구현하지 않는다.

### 변경 세트

- 백엔드 API 계약 변경은 프런트 타입과 소비 코드 수정까지 하나의 변경 세트로 본다.
- 규칙 문서를 수정하면 이 인덱스 문서도 함께 유지한다.

## 3. 백엔드 규칙

### API 모델

- 요청/응답에서 `Map`, `Object`, 익명 구조를 사용하지 않는다.
- API 계약은 명시적인 DTO로 표현한다.
- 엔티티는 영속성 모델이며 외부 계약 모델이 아니다.

### 레이어 기준

- DDD와 SOLID를 기본 설계 원칙으로 사용한다.
- 도메인 모듈 기본 패키지 구조는 `presentation / application / domain / infrastructure`다.
- `presentation`: HTTP entry, validation entry, request/response mapping, serialization
- `application`: 유스케이스, orchestration, transaction boundary
- `domain`: 상태, 규칙, 도메인 행위
- `infrastructure`: 영속성 접근, 프레임워크/외부 시스템 연동
- `infrastructure.persistence`: Spring Data repository, JPA query, persistence adapter

### 백엔드 필수 추가 규칙

- 비즈니스 규칙을 `presentation`에 두지 않는다.
- `infrastructure.persistence` repository는 정책 판단을 수행하지 않는다.
- 입력 검증은 API 경계에서 수행하고 핵심 불변식은 `application`/`domain`에서 다시 보장한다.
- 트랜잭션 경계는 명시적으로 관리한다.

### 에러 응답

- 표준은 RFC 9457 Problem Details다.
- 기본 필드: `type`, `title`, `status`, `detail`, `instance`
- 허용 확장 필드 예시: `code`, `errors`, `timestamp`, `traceId`
- 모든 예외는 공통 처리기에서 동일한 외형으로 변환한다.
- 운영 환경 응답에는 내부 스택 정보나 구현 상세를 노출하지 않는다.

## 4. 프런트 규칙

- 서버 응답은 타입 기반으로 소비한다.
- `any` 기반 API 처리나 화면별 ad-hoc 파싱을 피한다.
- Problem Details 파싱은 공통 API 계층에 둔다.
- 컴포넌트는 화면 상태와 상호작용에 집중하고, 네트워크 에러 형식 해석을 중복 구현하지 않는다.
- 프런트 검증은 보조 수단이며 백엔드 검증을 대체하지 않는다.

## 5. 테스트 규칙

### 테스트 설계

- 성공 시나리오만 검증하는 테스트보다 실패 가능성이 높거나 경계가 복잡한 테스트를 우선한다.
- 새 기능이나 버그 수정에는 최소 1개 이상의 negative 또는 edge-case 테스트를 포함한다.
- 예상하기 어려운 상태 전이, 범위 처리, invalid input, 회귀 가능성이 큰 흐름을 우선 검증한다.

### 테스트 리뷰 문서화

- 테스트가 성공하면 무엇이 성공했고 어떤 위험이 남았는지 분석 문서를 남긴다.
- 저장 위치는 `docs/test_review/`다.
- 권장 파일명은 `YYYY-MM-DD-<feature-or-module>.md`다.

권장 템플릿:

```md
# Test Review

## Target

## Commands

## Passed

## Failed

## Risk Analysis

## Not Covered

## Follow-up
```

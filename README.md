# Asterum Integrated Scheduler

아티스트와 제작진이 함께 사용하는 통합 스케줄 관리 시스템입니다.  
일회성 일정부터 복잡한 반복 일정까지, 팀 단위 참여자 지정과 리소스 중복 방지까지 지원합니다.

---

## 실행 방법

### 사전 요구사항

- Java 25+
- Node.js 18+
- npm

### 백엔드 실행

```bash
cd backend

# macOS / Linux
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

백엔드는 `http://localhost:8083` 에서 실행됩니다.

> H2 콘솔: `http://localhost:8083/h2-console`  
> JDBC URL: `jdbc:h2:file:./data/asterum`

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:5173` 에서 실행됩니다.  
API 요청은 자동으로 `http://localhost:8083` 으로 프록시됩니다.

### 초기 데이터

백엔드 최초 실행 시 아래 시드 데이터가 자동으로 생성됩니다.

| 유형 | 데이터                            |
|------|--------------------------------|
| 멤버 | 5명 (예준, 노아, 은호, 밤비, 하민)        |
| 스태프 | 4명 (카메라맨A, 편집자B, 디자이너C, 음향기사D) |
| 팀 | 3팀 (영상팀, 디자인팀, 프로덕션팀)          |
| 리소스 | 3개 (메인 스튜디오, B 세트장, 회의실 A)     |

---

## 구현된 기능

### MVP 1: 일회성 일정 관리

- 월간 달력에서 날짜를 클릭해 일정 등록
- 제목, 날짜, 시작/종료 시간 입력
- 참여자 선택 (멤버 또는 스태프 개별 지정)
- 촬영 장소(리소스) 선택
- 등록된 일정 클릭 시 상세 확인, 수정, 삭제

### MVP 2: 반복 일정 관리

**반복 옵션**
- 매일 / 매주 / 매월 반복

**종료 조건**
- 특정 날짜까지 반복
- 특정 횟수 반복
- 무기한 반복

**범위 지정 수정/삭제**
- `이 일정만` — 해당 날짜 1건만 변경
- `이후 모든 일정` — 선택일 포함 이후 전체 변경
- `전체 일정` — 장소(시리즈) 전체 변경

**예외 처리**
- 반복 시리즈 중 특정 날짜만 별도 수정 가능 (Exception Occurrence)

### 선택 기능

| 기능 | 구현 여부 | 설명 |
|------|-----------|------|
| 유형 전환 | ✅ | 일회성 일정을 반복 일정의 시작점으로 즉시 전환 |
| 팀 단위 지정 | ✅ | 개별 참여자 대신 팀 전체를 참여자로 지정 |
| 리소스 중복 방지 | ✅ | 동일 시간 동일 장소 중복 예약 방어 (DB 레벨 검증) |
| 영속성 유지 | ✅ | H2 파일 모드로 서버 재시작 후에도 데이터 보존 |

### UI 기능

- **월간 뷰**: 달력 그리드, 날짜별 일정 목록, 오버플로우 처리
- **주간 뷰**: 타임라인 기반 주간 일정 뷰 (시간축 표시)
- **참여자/팀 관리**: 모달에서 참여자 및 팀 CRUD
- **스태프·팀 관리 모달**: 참여자 추가·편집·삭제 인라인 처리

---

## 기술 스택

### 프론트엔드

| 항목 | 버전 |
|------|------|
| React | 19.2.4 |
| TypeScript | ~6.0.2 |
| Vite | 8.0.4 |
| TanStack React Query | 5.99.1 |
| Zustand | 5.0.12 |
| Tailwind CSS | 3.4.17 |
| Vitest | 4.0.7 |

### 백엔드

| 항목 | 버전 |
|------|------|
| Java | 25 |
| Spring Boot | 4.0.5 |
| Spring Data JPA | (Boot 관리) |
| H2 Database | 파일 모드 |
| Gradle | 8.x |

---

## DB 연관관계

```
participants ─────────────────────────────────────────────────────────┐
     │                                                                 │
     │ (N:M)                                                           │ (N:M)
     │                                                                 │
schedule_series ──── (1:N) ──── schedule_occurrences                  │
     │                                    │                            │
     │ (N:M)                              │ (N:M)                      │
     │                                    │                            │
  teams ◄──── team_members ────► participants                          │
     │                                                                 │
     └──── schedule_series_teams ◄────────┘                           │
                                                                       │
schedule_series ──────────────────────────────────────────────────────┘
     │
     └── resource_id (FK, nullable) ──► resources
```

**핵심 관계 요약**

| 관계 | 설명 |
|------|------|
| `schedule_series` → `schedule_occurrences` | 1:N, 반복 정의 → 개별 인스턴스 |
| `schedule_series` ↔ `participants` | N:M, 시리즈 기본 참여자 |
| `schedule_occurrences` ↔ `participants` | N:M, 예외 발생 시 오버라이드 |
| `schedule_series` ↔ `teams` | N:M, 팀 단위 참여 |
| `schedule_occurrences` ↔ `teams` | N:M, 예외 발생 시 오버라이드 |
| `teams` → `participants` | N:M (`team_members` 조인) |
| `schedule_series` → `resources` | N:1, 장소 지정 (선택) |
| `schedule_occurrences` → `resources` | N:1, 예외 발생 시 오버라이드 |

---

## 테이블 설명

### `participants`
아티스트 멤버 및 스태프를 저장합니다.

| 컬럼 | 설명 |
|------|------|
| `id` | PK |
| `name` | 참여자 이름 |
| `type` | `MEMBER` (멤버) / `STAFF` (스태프) |
| `created_at`, `updated_at` | 생성/수정 시각 |

---

### `teams`
팀 단위 참여자 그룹을 저장합니다.

| 컬럼 | 설명 |
|------|------|
| `id` | PK |
| `name` | 팀 이름 (예: 영상팀) |

---

### `team_members`
팀과 참여자 간의 N:M 조인 테이블입니다.

| 컬럼 | 설명 |
|------|------|
| `team_id` | FK → `teams.id` |
| `participant_id` | FK → `participants.id` |

---

### `resources`
스튜디오, 세트, 연습실 등 촬영 장소를 저장합니다.

| 컬럼 | 설명 |
|------|------|
| `id` | PK |
| `name` | 장소명 (예: 스튜디오 A) |
| `category` | `STUDIO` / `SET` / `ROOM` |

---

### `schedule_series`
반복 일정의 **정의(definition)** 를 저장합니다. 일회성 일정도 내부적으로 `recurrence_type = null` 인 시리즈로 저장됩니다.

| 컬럼 | 설명 |
|------|------|
| `id` | PK |
| `title` | 일정 제목 |
| `start_time` | 시작 시각 |
| `end_time` | 종료 시각 |
| `resource_id` | FK → `resources.id` (nullable) |
| `recurrence_type` | `DAILY` / `WEEKLY` / `MONTHLY` / null |
| `interval_value` | 반복 간격 (예: 2이면 2주마다) |
| `end_type` | `UNTIL_DATE` / `COUNT` / `NEVER` |
| `until_date` | 반복 종료 날짜 (end_type = UNTIL_DATE) |
| `occurrence_count` | 반복 횟수 (end_type = COUNT) |
| `anchor_date` | 반복의 기준 시작 날짜 |
| `active` | 활성 여부 |

---

### `schedule_occurrences`
시리즈로부터 생성된 **개별 일정 인스턴스**를 저장합니다.  
예외 처리(수정/삭제)가 발생한 경우 해당 인스턴스만 별도 데이터를 보유합니다.

| 컬럼 | 설명 |
|------|------|
| `id` | PK |
| `series_id` | FK → `schedule_series.id` |
| `title` | 오버라이드된 제목 (예외 시) |
| `occurrence_date` | 해당 일정의 날짜 |
| `start_time` / `end_time` | 오버라이드된 시각 (예외 시) |
| `resource_id` | 오버라이드된 장소 (예외 시) |
| `status` | `ACTIVE` / `CANCELLED` |
| `is_exception` | 시리즈 기본값에서 변경된 예외 여부 |

---

### `schedule_series_participants` / `schedule_occurrence_participants`
시리즈 또는 개별 인스턴스와 참여자 간의 N:M 조인 테이블입니다.  
예외 처리된 인스턴스는 `occurrence_participants`에서 참여자를 오버라이드합니다.

---

### `schedule_series_teams` / `schedule_occurrence_teams`
시리즈 또는 개별 인스턴스와 팀 간의 N:M 조인 테이블입니다.

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/schedules?year={}&month={}` | 월별 일정 목록 조회 |
| GET | `/api/schedules/{id}` | 일정 상세 조회 |
| POST | `/api/schedules` | 일정 생성 (일회성 / 반복) |
| PUT | `/api/schedules/{id}?scope={THIS\|FOLLOWING\|ALL}` | 일정 수정 (범위 지정) |
| DELETE | `/api/schedules/{id}?scope={THIS\|FOLLOWING\|ALL}` | 일정 삭제 (범위 지정) |
| POST | `/api/schedules/{id}/convert-to-series` | 일회성 → 반복 일정 전환 |
| GET | `/api/participants` | 참여자 목록 조회 |
| POST | `/api/participants` | 참여자 등록 |
| PUT | `/api/participants/{id}` | 참여자 수정 |
| DELETE | `/api/participants/{id}` | 참여자 삭제 |
| GET | `/api/teams` | 팀 목록 조회 |
| POST | `/api/teams` | 팀 등록 |
| PUT | `/api/teams/{id}` | 팀 수정 |
| DELETE | `/api/teams/{id}` | 팀 삭제 |
| GET | `/api/resources` | 리소스(장소) 목록 조회 |

---

## 아키텍처

### 백엔드 — DDD 레이어 구조

```
presentation/   ← Controllers, Request/Response DTOs
application/    ← CommandService (쓰기), QueryService (읽기)
domain/         ← Entity, Value Object, 도메인 규칙
infrastructure/ ← Repository, JPA 구현체
```

### 프론트엔드 — Feature 기반 구조

```
src/
├── api/           ← 도메인별 API 클라이언트
├── features/
│   ├── calendar/  ← 월간·주간 캘린더 뷰, Zustand 상태
│   ├── schedule/  ← 일정 등록/수정/삭제 모달
│   ├── participant/ ← 참여자 선택 및 관리 모달
│   └── team/      ← 팀 선택 컴포넌트
├── types/         ← 공유 TypeScript 타입 정의
└── App.tsx        ← 루트 컴포넌트
```

---

## 테스트 실행

```bash
# 프론트엔드 테스트
cd frontend
npm test

# 백엔드 테스트
cd backend
./gradlew test
```

---

## 주요 설계 결정

**일정 모델: Series + Occurrence 분리**  
반복 일정을 `schedule_series`(정의)와 `schedule_occurrences`(인스턴스)로 분리해 저장합니다. 일회성 일정도 동일 모델을 공유하며, 예외 처리(특정 날짜만 수정)는 해당 Occurrence에만 데이터를 오버라이드하는 방식으로 구현됩니다.

**리소스 중복 방지**  
일정 생성/수정 시 동일 날짜·시간에 동일 리소스가 이미 사용 중인지 DB 레벨에서 검증합니다.

**에러 응답 형식**  
RFC 9457 Problem Details 형식을 따릅니다 (`type`, `title`, `status`, `detail`).

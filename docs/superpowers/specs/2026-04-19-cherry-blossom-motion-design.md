# Cherry Blossom Motion Design

## Goal

현재 프런트엔드의 테마와 색상을 유지한 상태에서 다음 두 가지 연출을 추가한다.

1. 상단 히어로 영역에 벚꽃이 흩날리는 장식성 모션을 넣는다.
2. 강조 버튼 클릭 시 짧게 퍼지는 파티클 효과를 넣는다.

기존 일정 관리, 모달, 캘린더 조작 등 완료된 기능은 훼손하지 않는다.

## Scope

### In Scope

- `frontend/src/App.tsx`
  히어로 영역에만 벚꽃 장식 레이어를 추가한다.
- `frontend/src/index.css`
  현재 팔레트에 맞춘 꽃잎/파티클 애니메이션 스타일을 추가한다.
- 프런트엔드 공용 UI 유틸 또는 컴포넌트
  강조 버튼에 재사용 가능한 클릭 파티클 래퍼 또는 훅을 추가한다.
- `frontend/src/features/calendar/CalendarPage.tsx`
  현재 화면의 주요 강조 액션에만 파티클 효과를 적용한다.

### Out of Scope

- 앱 전체 화면에 상시 파티클을 뿌리는 전역 이펙트
- 새로운 색상 체계나 테마 변경
- 캘린더 셀, 리스트 아이템, 보조 버튼 전체에 대한 광범위한 클릭 이펙트
- 외부 파티클 라이브러리 도입
- 테스트 추가 및 실행

## Design Decisions

### 1. Hero Blossom Layer

히어로 카드 내부에만 절대 배치되는 장식 레이어를 둔다. 이 레이어는 실제 콘텐츠 위를 가리지 않도록 투명도와 크기를 낮게 유지하고, `pointer-events: none`으로 설정한다.

꽃잎은 HTML 요소 여러 개를 반복 렌더링하는 단순 구조로 만든다. 각 꽃잎은 시작 위치, 지연 시간, 지속 시간을 조금씩 달리해 자연스럽게 내려오도록 한다. 모션은 `transform`과 `opacity`만 사용하고, 좌우 흔들림을 약하게 섞는다.

### 2. Accent Button Particle

클릭 파티클은 `dream-button-primary` 계열의 강조 액션 중심으로만 적용한다. 현재 화면에서는 최소한 `일정 등록` 버튼이 대상이며, 필요 시 같은 역할의 주요 CTA로 확장 가능하도록 구현은 재사용 가능하게 만든다.

클릭 시 버튼 내부 좌표를 기준으로 작은 꽃잎/광점 6~10개가 짧게 퍼졌다가 사라진다. 실제 버튼 클릭 로직은 그대로 유지하고, 파티클은 시각 효과만 담당한다.

### 3. Theme Preservation

새로운 브랜드 컬러는 만들지 않는다. 이미 사용 중인 핑크, 라일락, 화이트 계열을 투명도로만 조합한다. 기존 버튼 배경, 패널 유리감, 텍스트 대비는 변경하지 않는다.

### 4. Accessibility and Safety

- `prefers-reduced-motion: reduce` 환경에서는 히어로 벚꽃과 클릭 파티클을 모두 비활성화한다.
- 장식 레이어는 포인터 이벤트를 차단하지 않는다.
- 레이아웃을 이동시키는 애니메이션은 사용하지 않는다.
- 파티클은 짧은 수명으로 정리해 DOM 누적을 막는다.

## Implementation Shape

### Component Structure

- `App.tsx`
  히어로 헤더 내부에 `HeroBlossomLayer`를 삽입한다.
- 신규 UI 컴포넌트 또는 훅
  `AccentParticleButton` 또는 `useAccentParticles` 형태로 구현한다.
- `CalendarPage.tsx`
  강조 버튼에만 새 파티클 동작을 연결한다.

### Styling Strategy

- 전역 CSS에 꽃잎과 파티클용 클래스 및 keyframes를 추가한다.
- 기존 `dream-` 계열 클래스와 충돌하지 않도록 별도 접두사를 사용한다.
- 효과 강도는 낮게 유지하고, hover/active의 기존 버튼 상호작용은 유지한다.

## Risks and Mitigations

### Risk: Motion distracts from scheduler usage

대응:
히어로에만 상시 모션을 제한하고, 클릭 파티클은 강조 버튼에만 넣는다.

### Risk: Particle overlay blocks interactions

대응:
장식 요소와 파티클 컨테이너는 `pointer-events: none`으로 고정한다.

### Risk: Existing styles regress

대응:
현재 클래스는 수정 범위를 최소화하고, 신규 컴포넌트/클래스로 효과를 추가하는 방식으로 적용한다.

## Verification Plan

테스트 실행은 이번 작업 범위에서 제외한다. 대신 구현 시 다음을 코드 수준에서 확인한다.

- 기존 버튼 클릭 핸들러 시그니처를 바꾸지 않는다.
- 모달, 캘린더, 전환 버튼의 동작 흐름을 직접 수정하지 않는다.
- 모션 감소 미디어쿼리에서 애니메이션이 비활성화되도록 스타일을 연결한다.

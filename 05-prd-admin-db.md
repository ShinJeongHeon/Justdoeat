# PRD — Just do eat 메인 서비스 DB (관리자 페이지 관리 대상 데이터 설계)

> 근거 문서: `01-prd-landing.md`(서비스 약속·3축 가치) · `03-prd-director.md`(관리자 v1·`item` 테이블·확정 결정) · `04-design-director.md`(콘솔 설계) · `index.html`(본 앱 프로토타입 — 실제 데이터 모델의 원본) · Supabase 현행 스키마(`item`, `Customer_email`)
> 산출물: 본 서비스(점심 추천 앱)의 Supabase DB 스키마·RLS·집계 설계와, 이를 관리자 페이지에서 운영하기 위한 요구사항 정의

**작성**: 제품 오너 + Claude Code · **날짜**: 2026-07-08 · **상태**: Draft

---

## 1. 요약 (Summary)

Just do eat 본 서비스의 **메인 서비스 DB**를 설계한다. 현재 앱은 서버 없는 단일 HTML 프로토타입이다 — 식당 24곳이 코드에 하드코딩되어 있고, 사용자의 조건·방문 기록·리뷰는 전부 브라우저 localStorage에 갇혀 있으며, "실시간 혼잡도"와 "커뮤니티 인기"는 난수 시뮬레이션이다.

이 PRD는 그 데이터를 Supabase로 옮겨 세 가지를 가능하게 한다:

1. **운영이 코드에서 분리된다** — 운영자가 관리자 페이지에서 동네를 열고 식당을 등록하면, 배포 없이 앱에 반영된다.
2. **랜딩의 약속이 진짜가 된다** — "당일 인증 리뷰"(그날 결정한 사람만, 그날만)와 "실시간 혼잡도"는 서버에 결정 기록이 쌓여야만 성립하는 약속이다. DB가 없으면 이 약속은 시뮬레이션, 즉 거짓말이다.
3. **데이터 사슬이 완성된다** — `대기자 명단(수요) → 동네 오픈(결정) → 식당 카탈로그(공급) → 결정·리뷰(사용)`. 관리자 v1이 "어느 동네부터 열까"에 답했다면, 이 DB는 "연 다음에 무엇을 운영하는가"에 답한다.

---

## 2. 이해관계자 (Contacts)

| 이름 | 역할 | 비고 |
|---|---|---|
| 제품 오너 (사용자) | 기획·최종 승인·유일한 운영자 | 관리자 페이지에서 동네·식당·리뷰를 직접 운영 |
| Claude Code | 설계·구현 | 본 PRD 작성, DB 마이그레이션·관리자 확장 개발 담당 |

---

## 3. 배경 (Background)

### 3.1 현재 상태

- **본 앱(`index.html`)**: 의존성 없는 단일 HTML. 추천 엔진(하드 필터 + 가감점 breakdown)은 완성도가 높으나, 데이터는 전부 정적이다.
- **DB(Supabase)**: 메인 서비스 테이블이 **하나도 없다.** 존재하는 것은 대기자 명단 `item`(관리자 v1이 사용)과 미사용 `Customer_email`(deprecated, 미접촉)뿐.
- **관리자(`admin/`)**: v1 완료 — 대기자 조회·동네 랭킹·CSV 내보내기. 관리 대상이 대기자뿐이므로, 정작 "동네를 연 다음"의 운영(식당 등록·리뷰 관리)은 할 곳이 없다.

### 3.2 프로토타입 데이터 인벤토리 (source of truth: `index.html`)

무엇이 DB로 가고 무엇이 클라이언트에 남는지가 이 설계의 절반이다.

| 프로토타입 데이터 | 현재 위치 | 목적지 | 근거 |
|---|---|---|---|
| `RESTAURANTS[]` 24곳 (이름·카테고리·대표메뉴·가격·거리/방위·맵기·알레르기·태그·영양·원산지·식사시간) | 코드 하드코딩 | **DB `restaurant`** | 운영자가 관리해야 할 마스터 데이터. 거리/방위(`dist`/`deg`)는 사용자 상대값이므로 **절대 좌표(lat/lng)로 전환**, 거리는 클라이언트 계산 |
| 동네(오픈 지역) 개념 | 없음 (암묵적으로 "서울시청 반경") | **DB `hood`** | "신청 많은 동네부터 엽니다"의 실행 단위. 대기자 `company_norm`과 연결 |
| 사용자 조건 (`budget`·`monthBudget`·`party`·`allergies`·`catPrefs`·`spicy`·`radius`·`workplace`·`banned`) | localStorage | **DB `user_prefs`** | 기기 간 이어지는 개인화의 전제 |
| 방문 기록 `visits[]` (날짜·식당·가격·피드백·리뷰) | localStorage | **DB `decision` + `review`** | 혼잡도 집계·당일 인증 리뷰·식사 달력·월간 리포트의 원천 |
| 혼잡도·오늘의 인기 (`crowdCount`·`popularToday`) | 난수 시뮬레이션 | **DB 집계 RPC** | 코드 주석이 명시: "실서비스: 같은 반경 내 사용자들이 '이걸로 결정'한 수를 서버에서 집계" |
| 리뷰 `SEED_REVIEWS` | 코드 하드코딩 | **DB `review`** | 당일 인증 제약을 DB가 강제해야 진짜 신뢰 장치 |
| 캘린더 일정 `events[]` | localStorage | **클라이언트 유지** | 개인 일정은 추천 입력일 뿐 서버 가치가 없고, 올리면 프라이버시 부담만 생긴다 |
| 날씨 | Open-Meteo API | **클라이언트 유지** | 외부 API 직접 호출로 충분 |
| 추천 엔진(점수 계산) | 클라이언트 JS | **클라이언트 유지** | 데이터는 DB에, 계산은 앱에. 서버 엔진 이전은 이 PRD 범위 밖 |

### 3.3 ⚠ 보안 선결 이슈 — "authenticated = 관리자" 가정의 붕괴

관리자 v1의 RLS는 **로그인한 사람 = 운영자**라는 가정 위에 서 있다(`item`에 `authenticated` 롤 SELECT/UPDATE, RPC 4종 execute). 이 가정은 지금까지 참이었다 — 계정이 관리자 하나뿐이니까.

**메인 서비스에 사용자 계정이 생기는 순간 이 가정은 깨진다.** 아무 사용자나 가입해 로그인하면 그 세션은 `authenticated`이고, 현행 정책대로면 **대기자 전원의 이메일·전화번호를 읽을 수 있다.** 따라서 사용자 인증을 여는 것보다 **역할 분리(운영자/사용자)가 먼저다.** 이것이 본 설계의 마이그레이션 순서를 지배한다(§8.7).

---

## 4. 목표 (Objective)

**목표**: 본 서비스의 데이터를 운영 가능한 DB로 옮겨, ① 운영자가 코드 배포 없이 공급(동네·식당)을 관리하고, ② 랜딩이 약속한 신뢰 장치(당일 인증 리뷰·실시간 혼잡도)를 구조적으로 강제하며, ③ 그 과정에서 대기자·사용자의 개인정보가 단 한 줄도 새지 않게 한다.

**핵심 결과 (Key Results)**:

| KR | 목표 | 측정 방법 |
|---|---|---|
| KR1 | 운영자가 관리자 페이지에서 **식당 등록 → 앱 노출까지 코드 배포 0회**, 5분 이내 | 직접 조작 테스트 |
| KR2 | **당일 결정 없는 리뷰 INSERT가 DB 레벨에서 거부**된다 (API를 직접 때려도) | RLS 검증 테스트 (필수 통과) |
| KR3 | **일반 사용자 계정으로 대기자 PII·타인의 조건/기록이 0건 조회** — 관리자만 통과 | RLS 검증 테스트 (필수 통과) |
| KR4 | 혼잡도·인기 집계가 실데이터 기반이며, 결정 10만 건 규모에서 **100ms 내** 응답 | 더미 데이터 부하 확인 |
| KR5 | 기존 localStorage 기록(조건·방문)이 첫 로그인 시 **1회 이관**되어 이어진다 | 직접 조작 테스트 |

---

## 5. 사용자 세그먼트 (User Segments)

- **운영자 (제품 오너, 현재 유일)**: 관리자 페이지에서 동네 오픈 결정을 실행하고(대기자 랭킹 → `hood` open), 식당을 등록·수정·숨기고, 리뷰를 모더레이션한다. 역할은 `admin`.
- **앱 사용자 (본 서비스)**: 조건을 설정하고 추천을 받고 결정·피드백·리뷰를 남긴다. **카탈로그 열람은 로그인 없이(anon), 기록이 남는 행위(결정·리뷰·조건 저장)는 로그인 후.** 역할은 `user`.
- **시스템 (집계)**: 개인 행을 노출하지 않고 합계만 내는 RPC. 혼잡도·인기·관리자 지표.
- **제약**:
  - 별도 백엔드 없음(프로젝트 일관 철학). 보안 경계는 **Supabase RLS가 전부**다 — UI가 아니라 DB가 막아야 한다.
  - 클라이언트에 `service_role` 키 금지(관리자 v1과 동일).
  - 초기 규모: 동네 1~3개, 식당 수십~수백, 사용자 수백. 대규모 분산 설계가 아니라 **정확한 권한 경계와 단순한 스키마**가 목표.

---

## 6. 가치 제안 (Value Propositions) — 이 DB가 해결할 일(Jobs)

| 일(Job) | 주체 | 얻는 것 | 없으면 겪는 고통 |
|---|---|---|---|
| ① **동네 오픈 실행** — "역삼동을 열자" | 운영자 | `hood` 상태 전환 + 그 동네 식당 등록 | 오픈이 코드 배포 작업이 됨. 랜딩 약속("먼저 엽니다")의 실행이 막힘 |
| ② **공급 관리** — "식당 정보를 최신으로" | 운영자 | 식당 CRUD·숨김, 가격·메뉴 수정 | 폐업·가격 변동마다 개발자 호출 |
| ③ **신뢰 유지** — "가짜 리뷰가 못 들어오게" | 운영자·사용자 | 당일 인증을 DB가 강제 + 모더레이션 | 랜딩의 차별점("허위 리뷰 구조적 불가")이 거짓이 됨 |
| ④ **진짜 커뮤니티 신호** — "지금 어디가 붐비지?" | 사용자 | 오늘의 결정 수 실집계 | 난수 시뮬레이션 = 사용자를 속이는 UI |
| ⑤ **이어지는 개인화** — "폰을 바꿔도 내 취향 기억" | 사용자 | 조건·기록·리포트의 계정 귀속 | 기기 바꾸면 학습이 리셋 |
| ⑥ **개인정보 문단속** — "사용자를 받아도 PII 안전" | 운영자 | 역할 분리된 RLS | §3.3 — 가입자 전원이 대기자 명단을 읽는 사고 |

**핵심 통찰**: 무게중심은 **③당일 인증 리뷰의 DB 강제**다. 랜딩이 경쟁 우위로 내세운 유일한 구조적 장치이고, "클라이언트 검증"으로는 흉내조차 낼 수 없기 때문이다(§8.5의 RLS 정책 한 줄이 이 약속의 실체다).

---

## 7. 요구사항 (Requirements)

**P0 — Must Have**

| # | 스토리 | 수용 기준 |
|---|---|---|
| P0-1 | 운영자로서, 사용자 계정이 생겨도 대기자 PII가 새지 않도록 **역할을 분리**하고 싶다 | `profiles.role` 도입, `item` 정책·관리자 RPC가 `is_admin()`으로 교체. 일반 계정 조회 시 0건/42501 (KR3) |
| P0-2 | 운영자로서, 관리자 페이지에서 **동네를 열고 식당을 등록**하고 싶다 | `hood`·`restaurant` CRUD, 등록 즉시 앱(anon)에서 조회됨 (KR1) |
| P0-3 | 사용자로서, 앱에서 **실제 DB의 식당**으로 추천을 받고 싶다 | 앱이 `RESTAURANTS` 상수 대신 `restaurant` 테이블을 읽음. 기존 24곳 시드 이관 |
| P0-4 | 사용자로서, 오늘의 **결정과 피드백을 계정에 기록**하고 싶다 | `decision` insert/update 본인 행만. 하루 1건(교체 가능) |
| P0-5 | 사용자로서, **그날 결정한 식당에만, 그날만** 리뷰를 쓰고 싶다 | 당일 결정 없는 리뷰 INSERT가 RLS에서 거부 (KR2) |

**P1 — Should Have**

| # | 스토리 | 수용 기준 |
|---|---|---|
| P1-1 | 사용자로서, **혼잡도·오늘의 인기**를 실데이터로 보고 싶다 | 집계 RPC(개인 행 비노출), 100ms 내 (KR4) |
| P1-2 | 사용자로서, 기존 **localStorage 기록을 계정으로 이관**하고 싶다 | 첫 로그인 시 1회 가져오기 (KR5) |
| P1-3 | 운영자로서, **부적절 리뷰를 숨기고** 싶다 | `review.hidden_at` 소프트 숨김 + 관리자 목록 |
| P1-4 | 운영자로서, 서비스 **핵심 지표**(오늘 결정 수·동네별 활성)를 관리자 대시보드에서 보고 싶다 | `is_admin()` 게이트 집계 RPC |

**P2 — Nice to Have / Future**

| # | 스토리 | 수용 기준 |
|---|---|---|
| P2-1 | 운영자로서, 대기자 동네 랭킹에서 바로 **"이 동네 열기"** 버튼을 누르고 싶다 | 랭킹 → `hood` 생성·오픈 연결 (관리자 v1 시그니처의 연장) |
| P2-2 | 사용자로서, 리뷰에 **닉네임**이 자연스럽게 보였으면 한다 | `profiles.nickname` 공개 범위 정의 |
| P2-3 | 운영자로서, 식당 **사진**을 올리고 싶다 | Supabase Storage — 본 PRD 범위 밖, 스키마만 확장 여지 |

---

## 8. 솔루션 (Solution) — DB 설계

### 8.1 설계 원칙

1. **RLS가 곧 보안 경계**: 모든 테이블 RLS 활성. "UI에서 안 보여줌"은 보안이 아니다 — anon 키로 REST를 직접 때려도 정책이 막아야 한다(관리자 v1의 KR3 철학 계승).
2. **역할은 한 곳에서**: 관리자 판별은 `profiles.role` + `is_admin()` 함수 하나로. 정책마다 다른 기준을 두지 않는다.
3. **개인 행과 집계의 분리**: 운영자도 사용자 개인의 식사 이력을 행 단위로 보지 않는다. 관리자 지표는 집계 RPC로만 — PII 최소 수집 원칙을 스키마가 강제.
4. **데이터는 DB에, 계산은 앱에**: 추천 점수·거리 계산은 클라이언트 유지. DB는 사실(식당·결정·리뷰)과 합계만 책임진다.
5. **소프트 삭제 계승**: 관리자 v1의 확정 결정과 동일 — `deleted_at`/`hidden_at`으로 숨기고, 물리 삭제는 하지 않는다.
6. **날짜 경계는 Asia/Seoul**: "당일 인증"·"오늘의 혼잡도"의 '오늘'은 한국 날짜다. `decided_on`은 `(now() at time zone 'Asia/Seoul')::date` 기준 — UTC 자정 버그(오전 9시 전 리뷰 거부)를 원천 차단.
7. **레거시 불간섭**: `item`(대기자)·`Customer_email`은 구조를 바꾸지 않는다. 바뀌는 것은 `item`의 **접근 정책**뿐(§3.3).

### 8.2 ERD 개요

```
auth.users (Supabase Auth)
   │ 1:1
   ▼
profiles ────────────── role: 'user' | 'admin'  ← is_admin()의 단일 근거
   │ 1:1                nickname (리뷰 표시명)
   ▼
user_prefs ──────────── 조건: 예산·인원·맵기·반경·알레르기·카테고리 선호·차단 목록·직장 위치
   │
   │ 1:N
   ▼                         N:1
decision ──────────────────────────▶ restaurant ──────▶ hood
   │  하루 1건 (user, decided_on)      카탈로그(공급)      동네(오픈 단위)
   │  가격 스냅샷·피드백                 24곳 시드 이관       status: preparing/open/closed
   │ 1:0..1                                                  ↕ (개념 연결)
   ▼                                                    item.company_norm
review ──────────────── 당일 인증: "오늘 결정한 사람만" RLS가 강제   (대기자 수요 → 오픈 결정)
```

### 8.3 테이블 스펙

#### `profiles` — 사용자 프로필 · 역할의 단일 근거

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | `uuid` PK, FK → `auth.users(id)` | 가입 트리거로 자동 생성 |
| `nickname` | `text` | 리뷰 표시명. 초기값 자동 생성(예: "점심러버-3f2a") |
| `role` | `text` CHECK in (`'user'`,`'admin'`) default `'user'` | **본인이 UPDATE 불가**(컬럼 grant 제외). 승격은 운영자가 SQL/대시보드에서 수동 |
| `created_at` | `timestamptz` default `now()` | |

- `is_admin()`: `security definer stable` 함수 — `exists(select 1 from profiles where id = auth.uid() and role = 'admin')`. `search_path` 고정. 모든 관리자 정책이 이 함수 하나를 참조.
- 가입 트리거: `auth.users` INSERT → `profiles` 자동 생성(Supabase 표준 패턴).

#### `hood` — 동네 (오픈 단위)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | `bigint` identity PK | |
| `name` | `text` unique | 표시명 "역삼동" |
| `norm_key` | `text` | 대기자 `item.company_norm`과 매핑하는 정규화 키 |
| `status` | `text` CHECK in (`'preparing'`,`'open'`,`'closed'`) default `'preparing'` | 앱에는 `open`만 노출 |
| `center_lat` / `center_lng` | `double precision` | 동네 중심 좌표(기본 지도·시드 기준점) |
| `opened_at` | `timestamptz` null | 오픈 실행 시각 — "약속 이행"의 기록 |
| `created_at` / `updated_at` | `timestamptz` | |

#### `restaurant` — 식당 카탈로그 (운영자의 공급 관리 대상)

프로토타입 `RESTAURANTS` 필드를 1:1로 승계하되, 사용자 상대값(`dist`/`deg`)만 절대 좌표로 전환한다.

| 컬럼 | 타입 | 프로토타입 원본 | 비고 |
|---|---|---|---|
| `id` | `bigint` identity PK | `id`(문자열) | 시드 시 `slug` 컬럼에 원본 보존 |
| `hood_id` | `bigint` FK → `hood` | — (신규) | |
| `slug` | `text` unique | `id` | 앱 마이그레이션·localStorage 이관 매핑용 |
| `name` | `text` not null | `name` | |
| `category` | `text` not null | `category` | v1은 자유 텍스트(관리 UI가 기존 값 제안). 마스터 분리는 필요해질 때 |
| `signature_menu` | `text` not null | `menu` | |
| `emoji` | `text` | `emoji` | 카드 아이콘 |
| `price` | `integer` not null CHECK > 0 | `price` | 대표 메뉴 1인 가격 |
| `lat` / `lng` | `double precision` not null | `dist`/`deg` → 환산 | 거리·도보 시간은 클라이언트가 사용자 위치 기준 계산 |
| `spicy_level` | `smallint` CHECK 0~3 | `spicy` | |
| `allergens` | `text[]` default `'{}'` CHECK `<@` 6종 | `allergens` | 밀·계란·유제품·대두·견과류·갑각류 고정 어휘 |
| `tags` | `text[]` default `'{}'` CHECK `<@` 7종 | `tags` | hot·cold·light·heavy·fast·solo·group 고정 어휘 |
| `kcal` / `protein_g` / `carb_g` / `fat_g` | `integer` | `nutri` | 1인분 기준 |
| `nutri_src` | `text` | `src` | "표준" / "식당 제공" |
| `origin_info` | `text` | `origin` | 원산지 표기 원문 |
| `eat_minutes` | `smallint` not null | `eat` | 평균 식사 소요(추천 엔진의 시간 필터 입력) |
| `is_active` | `boolean` default `true` | — | 임시 숨김(휴업 등). 앱 노출 조건 |
| `deleted_at` | `timestamptz` null | — | 소프트 삭제(폐업 등) |
| `created_at` / `updated_at` | `timestamptz` | — | |

#### `user_prefs` — 사용자 조건 (1:1)

| 컬럼 | 타입 | 프로토타입 원본 |
|---|---|---|
| `user_id` | `uuid` PK, FK → `profiles` | — |
| `budget` | `integer` default 12000 | `budget` |
| `month_budget` | `integer` default 200000 | `monthBudget` |
| `party` | `smallint` default 1 | `party` |
| `spicy` | `text` CHECK in (`'love'`,`'ok'`,`'no'`) default `'ok'` | `spicy` |
| `radius_m` | `integer` default 800 | `radius` |
| `allergies` | `text[]` default `'{}'` CHECK `<@` 6종 | `allergies` |
| `cat_prefs` | `jsonb` default `'{}'` | `catPrefs` — `{"한식":"like","중식":"dislike"}` |
| `banned_restaurant_ids` | `bigint[]` default `'{}'` | `banned` — 하드 필터는 클라이언트 계산이므로 배열로 충분 |
| `work_lat` / `work_lng` / `work_name` | `double precision` / `text` | `workplace` |
| `updated_at` | `timestamptz` | — |

> 캘린더 `events`·날씨 설정(`weather`·`weatherAuto`)은 **서버에 올리지 않는다**(§3.2·원칙 3 — 개인 일정은 프라이버시 부담 대비 서버 가치 없음).

#### `decision` — 오늘의 결정 (서비스의 심장)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `user_id` | `uuid` FK → `profiles` not null | |
| `restaurant_id` | `bigint` FK → `restaurant` not null | |
| `decided_on` | `date` not null default `(now() at time zone 'Asia/Seoul')::date` | 한국 날짜 기준(원칙 6) |
| `price_at` | `integer` not null | **가격 스냅샷** — 식당 가격이 나중에 바뀌어도 월간 리포트가 안 흔들림 |
| `feedback` | `text` null CHECK in (`'like'`,`'dislike'`,`'ban'`) | 식후 피드백(추천 엔진의 학습 입력) |
| `created_at` | `timestamptz` default `now()` | |

- **`unique (user_id, decided_on)`** — 하루 점심 결정은 1건. "오늘의 결론"이라는 제품 철학의 스키마 표현이며, 당일 리뷰 자격 판정과 혼잡도 집계(1인 1표)를 단순하게 만든다. 재결정은 UPDATE(교체).
- 인덱스: `(restaurant_id, decided_on)` — 혼잡도 집계용. `(user_id, decided_on)`은 unique가 겸함(달력·리포트).

#### `review` — 당일 인증 리뷰 (신뢰 장치의 실체)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `decision_id` | `uuid` FK → `decision` **unique** not null | 1결정 1리뷰. 리뷰는 결정 없이는 존재 불가 |
| `user_id` | `uuid` not null | 정책 검증·표시명 조인용 |
| `restaurant_id` | `bigint` FK → `restaurant` not null | 비정규화(조회 단순화) |
| `liked` | `boolean` not null | 프로토타입 `feedback === 'like'` 승계 |
| `body` | `text` not null CHECK `char_length(body) between 1 and 500` | |
| `hidden_at` | `timestamptz` null | 운영자 모더레이션(소프트 숨김) |
| `created_at` | `timestamptz` default `now()` | |

- **당일 인증의 강제(KR2)** — INSERT 정책 `WITH CHECK`가 심장이다:

```sql
-- "그날 결정한 사람만, 그날만" — UI가 아니라 DB가 약속한다
create policy review_insert_same_day on review for insert
  to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from decision d
      where d.id = review.decision_id
        and d.user_id = auth.uid()
        and d.decided_on = (now() at time zone 'Asia/Seoul')::date
    )
  );
```

- 인덱스: `(restaurant_id, created_at desc) where hidden_at is null` — 식당별 리뷰 목록.

### 8.4 RLS 매트릭스 (역할 × 테이블)

| 테이블 | anon | user (authenticated) | admin |
|---|---|---|---|
| `hood` | SELECT (`status='open'`) | SELECT (`status='open'`) | ALL |
| `restaurant` | SELECT (`is_active and deleted_at is null` and 소속 hood open) | 좌동 | ALL |
| `profiles` | — | SELECT/UPDATE 본인 행 (`role` 컬럼 grant 제외) | SELECT 전체 |
| `user_prefs` | — | ALL 본인 행 | — (개인 행 접근 없음, 원칙 3) |
| `decision` | — | INSERT/SELECT/UPDATE 본인 행 | — (집계 RPC로만) |
| `review` | SELECT (`hidden_at is null`) | 좌동 + INSERT(당일 인증) + UPDATE/DELETE 본인·당일 | UPDATE (`hidden_at` 모더레이션) |
| `item` (기존) | INSERT만 (현행 유지 — 랜딩 폼) | **없음 ← v1의 SELECT/UPDATE 정책 교체** | SELECT/UPDATE (`is_admin()`) |

- 리뷰 익명 열람을 여는 이유: 카탈로그와 함께 리뷰가 서비스의 공개 얼굴이기 때문. 노출 컬럼은 `liked`·`body`·`created_at`·닉네임뿐 — 연락처류 PII가 아예 없다.
- 관리자 RPC 4종(v1: `admin_summary` 등)도 본문에 `is_admin()` 게이트 추가 — `authenticated` execute만으로는 더 이상 충분치 않다(§3.3).

### 8.5 집계 RPC (개인 행 비노출 — 원칙 3)

| RPC | 반환 | 소비자 | 비고 |
|---|---|---|---|
| `crowd_today(p_hood bigint)` | 식당별 오늘 결정 수 | 앱 (authenticated) | `security definer` + `search_path` 고정. 혼잡도 = 프로토타입 `crowdCount` 대체 |
| `popular_today(p_hood bigint, p_limit int)` | 오늘 인기 TOP N | 앱 (authenticated) | `popularToday` 대체 |
| `admin_service_summary()` | 오늘/주간 결정 수·활성 사용자·동네별 활성·리뷰 수 | 관리자 대시보드 | 본문 `is_admin()` 게이트, 아니면 42501 |

- anon에는 execute를 열지 않는다(스크래핑 방지·집계도 로그인 가치로). 월간 리포트·식사 달력은 본인 `decision` 조회로 충분 — RPC 불필요.

### 8.6 시드 & localStorage 이관

- **식당 24곳 시드**: 프로토타입 `RESTAURANTS`를 `restaurant`로 이관. 좌표는 프로토타입의 환산식 그대로 — 기준점(서울시청 37.5663, 126.9779) + `dist`/`deg` → lat/lng. 원본 문자열 id는 `slug`에 보존.
- **첫 동네**: 시드 동네 1개(`hood`: 예 "시청·을지로", status `open`)에 24곳 소속. 이후 실제 오픈은 대기자 랭킹이 결정.
- **localStorage 이관(KR5)**: 첫 로그인 시 앱이 `just-do-eat-v1`을 읽어 ① 조건 → `user_prefs` upsert, ② `visits[]` → `decision` 일괄 insert(`slug` 매핑, 하루 1건 초과분은 최신 것만), ③ 이관 완료 플래그를 localStorage에 기록(중복 이관 방지). 리뷰는 당일 인증 제약상 과거분 이관 불가 — 이관하지 않는 것이 원칙과 일치한다.

### 8.7 마이그레이션 순서 (보안이 순서를 지배한다)

1. `profiles` + 가입 트리거 + `is_admin()` — 역할의 근거 먼저
2. **`item` 정책 교체 + 관리자 RPC 게이트** — 사용자 가입을 열기 전에 문단속(§3.3, KR3)
3. `hood` + `restaurant` + 시드 24곳 + 카탈로그 공개 정책
4. `user_prefs` + `decision` + 인덱스
5. `review` + 당일 인증 정책
6. 집계 RPC 3종 + `updated_at` 트리거
7. 검증: 익명/일반 사용자/관리자 3개 세션으로 RLS 매트릭스 전 칸 테스트 (KR2·KR3)

### 8.8 가정 (검증 필요)

- [ ] 하루 1결정(unique)이 실사용과 맞다 — 저녁 확장 시 `meal` 컬럼 추가로 대응 가능 → 사용 관찰
- [ ] 알레르기 6종·태그 7종 고정 어휘로 충분하다 → 식당 등록 실무에서 확인
- [ ] 카테고리 자유 텍스트가 동네 2~3개 규모까지 관리 가능하다 → 관리 UI 사용 관찰
- [ ] 리뷰 익명 공개(SELECT to anon)가 초기 신뢰 형성에 유리하다 → 트래픽 후 재평가

---

## 9. 오픈 이슈 (Open Questions)

| 질문 | 소유자 | 시한 |
|---|---|---|
| 앱 로그인 UX — 이메일 매직링크 vs 소셜(카카오)? DB는 무엇이든 수용하나 가입 전환율이 갈림 | 제품 오너 | Phase 2 착수 전 |
| `hood`의 단위 — 행정동 기준인가, 대기자 자유 입력("판교")을 그대로 승격하는가 | 제품 오너 | 첫 동네 오픈 전 |
| 닉네임 정책 — 자동 생성 고정 vs 사용자 수정 허용(부적절 닉네임 리스크) | 제품 오너 | Phase 3 전 |
| 영양·원산지 정보의 표기 책임 — "식당 제공" 출처 표기로 충분한가(법적 검토) | 제품 오너 | 정식 출시 전 |
| 혼잡도 공개 범위 — 로그인 사용자 한정 유지 vs 랜딩·익명에도 티저로 노출 | 제품 오너 | Phase 2 후 |

---

## 10. 릴리스 (Release)

**Phase 1 — 공급과 문단속** *(사용자 가입을 열기 전에 끝나야 하는 것)*
- `profiles`·`is_admin()`·`item` 정책 교체(§8.7의 1~2) — **KR3 통과가 게이트**
- `hood`·`restaurant` + 시드 + 관리자 페이지 식당·동네 CRUD 화면
- 앱이 DB 카탈로그를 읽도록 전환(anon SELECT)
- 완료 기준: KR1·KR3 통과, 일반 계정으로 `item` 0건 검증

**Phase 2 — 사용자와 실데이터**
- 앱 로그인(선택적 — 열람은 여전히 익명 가능), `user_prefs`·`decision`
- 혼잡도·인기 RPC로 시뮬레이션 코드 대체, localStorage 1회 이관
- 완료 기준: KR4·KR5 통과, 결정 10만 건 더미 부하 확인

**Phase 3 — 신뢰 장치**
- `review` + 당일 인증 RLS + 관리자 리뷰 모더레이션(숨김)
- 관리자 대시보드에 서비스 지표(`admin_service_summary`)
- 완료 기준: KR2 통과 — REST 직접 호출로 "어제 결정" 리뷰 시도가 거부됨

**범위 제외 (이 PRD에서 하지 않는 것)**
- 식당주(사장님) 계정·셀프 등록 — 공급은 당분간 운영자 큐레이션
- 사진 업로드(Storage)·예약·결제·알림 발송
- 추천 엔진의 서버 이전, 실시간 채널(웹소켓) — 집계는 조회 시점 계산으로 충분
- `item`(대기자) 스키마 변경, `Customer_email` 정리 — 관리자 v1 확정 유지

### 확정 결정 (사용자 위임 → 이상적 기준으로 확정, 2026-07-08)

> 판단 기준: ① 보안 경계는 DB가 강제한다, ② 프로토타입이 증명한 모델을 그대로 승계하고 새 개념 발명을 최소화한다, ③ 1인 운영 규모의 단순함.

1. **역할 분리 = `profiles.role` + `is_admin()` 함수**: JWT 커스텀 클레임 방식보다 운영(승격·강등이 UPDATE 한 줄)이 단순하고, 정책 전부가 함수 하나를 참조해 감사도 쉽다.
2. **하루 1결정(unique)**: "오늘의 결론"이라는 제품 철학의 스키마 표현. 당일 리뷰 자격·1인 1표 혼잡도가 공짜로 따라온다. 재결정은 교체(UPDATE).
3. **당일 인증은 RLS `WITH CHECK`로**: 별도 RPC·트리거 없이 정책 서브쿼리 하나로 강제 — 가장 단순한 메커니즘이 가장 감사하기 쉽다.
4. **개인 일정(캘린더)은 서버에 올리지 않음**: 추천 입력일 뿐 서버 가치가 없고, 민감도 대비 얻는 게 없다.
5. **운영자는 개인 행이 아니라 집계만 본다**: 사용자 식사 이력은 본인만. 관리자 지표는 `security definer` RPC의 합계로만 — PII 최소화가 기본값.
6. **좌표는 절대값(lat/lng)으로 전환**: 프로토타입의 `dist`/`deg`는 "사용자 한 명" 가정의 산물. 다중 사용자·다중 동네에서는 절대 좌표 + 클라이언트 거리 계산이 유일하게 확장 가능한 형태다.

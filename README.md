# 21st Graduation Online Exhibition

대학 졸업 전시 작품·인물·쇼룸 정보를 온라인으로 아카이브하고 탐색할 수 있게 하는 **졸업 온라인 전시 웹사이트**입니다.

## 개요

이 저장소는 **Next.js App Router** 기반의 프론트엔드 프로젝트입니다. 방문자는 랜딩 페이지와 글로벌 헤더를 통해 Projects, People, Showroom, Credits 섹션으로 이동합니다. 각 섹션 페이지 본문은 퍼블리싱 단계이며, 현재는 **반응형 헤더·네비게이션 UX**가 구현되어 있습니다.

| 항목 | 내용 |
|------|------|
| 패키지 이름 | `21stgraduation` |
| 현재 버전 | `0.1.0` |
| 저장소 | [https://github.com/ms200279/21_Graduation](https://github.com/ms200279/21_Graduation) |
| 기본 언어(UI) | 영문 (`layout.tsx` 메타데이터 기준) |

### 해결하려는 문제

- 오프라인 졸업 전시를 **지속 가능한 웹 아카이브**로 남긴다.
- 작품·참여자·쇼룸·크레딧 정보를 **한 사이트에서 일관된 UX**로 제공한다.
- 이후 백엔드 연동 시 **인증·업로드·데이터 관리**를 같은 앱에서 확장할 수 있게 한다.

## 주요 기능

### 섹션 라우트 (페이지 본문: 빈 `main`)

| 경로 | 라벨 |
|------|------|
| `/` | 랜딩 |
| `/projectspage` | Projects |
| `/peoplepage` | People |
| `/showroompage` | Showroom |
| `/creditspage` | Credits |

### 글로벌 헤더 (`app/components/Header.tsx` + `app/globals.css`)

모바일·데스크톱은 **서로 다른 인터랙션**을 사용합니다. 뷰포트 기준은 아래 [반응형·브레이크포인트](#반응형브레이크포인트)를 참고하세요.

#### 모바일 (뷰포트 너비 ≤ 767px)

- `matchMedia("(max-width: 767px)")`로 모바일 분기 (`useIsMobile`)
- 헤더 위치: **우측 상단** (`right-4 top-4`), pill 형태 (`h-[44px]`)
- **랜딩(`/`)**: 햄버거 버튼 탭 → 메뉴 확장 → 4개 네비 버튼 표시
- **서브 페이지**: 현재 섹션 라벨 pill 탭 → 메뉴 확장; 헤더 밖 `pointerdown` 시 메뉴 닫힘
- 라벨·pill 너비: 숨김 측정 노드로 동적 계산 (`--mobile-page-pill-width`)
- 메뉴 선택 시 라벨 이동 애니메이션(720ms) 후 `router.push`
- 데스크톱용 **랜딩 오브(orb)** 는 모바일에서 렌더링하지 않음

#### 데스크톱 (뷰포트 너비 ≥ 768px)

- 헤더 위치: **상단 중앙** (`left-1/2 top-10`), `.desktop-header` CSS 변수 사용 (`globals.css`)
- **랜딩**: 확장형 네비 + 헤더 왼쪽 **오브** 애니메이션
- **서브 페이지**: 축소 pill → **`md:`(768px+) 그룹 호버** 시 확장, 현재 라벨이 그리드 오프셋 위치로 이동
- **1024px+(`lg:`)**: 네비를 flex 가로 배치, 라벨 `20px`
- 메뉴 클릭 시 라벨 전환 애니메이션 후 라우팅 (모바일과 동일 타이밍)

### 반응형·브레이크포인트

| 구분 | 기준 | 적용 위치 |
|------|------|-----------|
| JS 모바일 분기 | `max-width: 767px` | `Header.tsx` — `MOBILE_MEDIA_QUERY` |
| Tailwind `md:` | `min-width: 768px` | 데스크톱 호버 확장, 타이포 등 |
| Tailwind `lg:` | `min-width: 1024px` | 데스크톱 flex 네비, `20px` 라벨 |
| `.desktop-header` CSS 변수 | `768px` / `1024px` / `1280px` | `globals.css` — 헤더 너비·패딩·오브·라벨 오프셋 |

`768px` 미만에서는 `.desktop-header` 미디어쿼리 변수가 적용되지 않으며, 모바일은 `Header.tsx` 인라인 스타일(`mobileHeaderStyle`)을 사용합니다.

### 백엔드·데이터 (미구현)

`package.json`에 Supabase 클라이언트가 없고, 코드에 `process.env` 사용처가 없습니다. 프로젝트 규칙(`.cursor/rules/project-rules.mdc`)의 Supabase·인증·업로드는 **로드맵** 항목입니다.

## 기술 스택

| 구분 | 기술 | 버전(참고) |
|------|------|------------|
| 프레임워크 | [Next.js](https://nextjs.org/) (App Router) | 16.1.6 |
| UI | [React](https://react.dev/) | 19.2.3 |
| 스타일 | [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| 언어 | TypeScript | 5.x |
| 린트 | ESLint (`eslint-config-next`) | 9.x |
| 폰트 | `next/font` — Inter | — |

## 데모 또는 스크린샷

로컬: `npm run dev` 후 [http://localhost:3000](http://localhost:3000)

**확인 필요:** 프로덕션 URL, 스크린샷 자산 경로

## 시작하기

### 요구사항

- **Node.js** 20 LTS 권장 (`@types/node` ^20 기준)
- **npm** (아래 명령어는 npm 기준)

**확인 필요:** `.nvmrc`, `package.json` `engines` 등 팀 고정 버전

### 설치

```bash
git clone https://github.com/ms200279/21_Graduation.git
cd 21_Graduation
npm install
```

### 환경변수 설정

애플리케이션 코드에 **사용 중인 환경변수가 없습니다.** 연동 전까지 `.env.local`은 필수가 아닙니다.

향후 연동 시 `.env.local`을 사용하고, `.gitignore`에 의해 커밋되지 않게 관리하세요. 변수 이름·값은 팀/대시보드에서 확정 후 `docs/` 또는 `.env.example`로 문서화하는 것을 권장합니다.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

### 빌드

```bash
npm run build
npm run start
```

### 테스트·품질 검사

| 명령어 | 설명 |
|--------|------|
| `npm run lint` | ESLint (`eslint`) |

**확인 필요:** `npm test` 등 자동화 테스트 — `package.json`에 없음

### 수동 검증 (헤더·반응형)

레이아웃·헤더 변경 시 아래를 확인합니다 (Frontend Agent 규칙과 동일).

1. **모바일(≤767px)**: 랜딩 햄버거 → 메뉴 확장; 서브 페이지 pill 탭 → 확장; 바깥 탭 시 닫힘; 라우트 전환 애니메이션
2. **데스크톱(≥768px)**: 랜딩 오브·확장 네비; 서브 페이지 `md:` 호버 확장; `lg:` flex 네비
3. **브레이크포인트**: 767 / 768 / 1024 / 1280px 근처에서 레이아웃 전환

## 사용 방법

### 방문자

1. 랜딩(`/`)에서 헤더 UI 확인 (모바일: 메뉴 버튼, 데스크톱: 오브·확장 네비)
2. Projects / People / Showroom / Credits 이동
3. 섹션 콘텐츠는 추후 퍼블리싱 예정

### 개발자

- 경로 별칭: `@/*` → 프로젝트 루트 (`tsconfig.json`)
- UI·헤더 작업: `app/components/Header.tsx`, `app/globals.css`의 `.desktop-header` 변수
- Agent 세션: `.cursor/rules/` 해당 Agent 규칙의 **세션 첫 프롬프트** 참고 (`project-rules.mdc`)

## 프로젝트 구조

```
21_Graduation/
├── app/
│   ├── components/
│   │   └── Header.tsx       # 반응형 글로벌 네비 (모바일 터치 / 데스크톱 호버)
│   ├── creditspage/page.tsx
│   ├── peoplepage/page.tsx
│   ├── projectspage/page.tsx
│   ├── showroompage/page.tsx
│   ├── globals.css          # Tailwind + .desktop-header (768/1024/1280px)
│   ├── layout.tsx           # 루트 레이아웃, Header, Inter
│   └── page.tsx             # / 랜딩
├── public/                  # 정적 자산 (비어 있을 수 있음)
├── .cursor/rules/           # Cursor Agent·프로젝트 규칙
│   ├── project-rules.mdc    # 공통 (alwaysApply)
│   ├── pm-agent.mdc
│   ├── frontend-agent.mdc
│   ├── backend-agent.mdc
│   ├── docs-agent.mdc
│   ├── reviewer-agent.mdc
│   ├── tester-agent.mdc
│   ├── security-agent.mdc
│   └── devops-agent.mdc
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```

## 주요 명령어

| 명령어 | 용도 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |

## API 문서

**해당 없음 (현재).** Route Handler / Server Actions / REST API 구현 없음.

## 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| — | — | 코드베이스 미사용 |

연동 확정 후 본 표와 [환경변수 설정](#환경변수-설정)을 갱신하세요. **secret·키 값은 README에 넣지 마세요.**

## 배포

저장소에 `vercel.json`, CI 워크플로, 배포 스크립트가 **없습니다.** 호스트·브랜치 전략·환경 변수는 팀에서 확정해야 합니다.

빌드·실행 명령(Next.js 기본):

- Build: `npm run build`
- Start: `npm run start`

## 트러블슈팅

### 설치·빌드 실패

```bash
rm -rf node_modules .next
npm install
npm run build
```

### 포트 충돌

```bash
npm run dev -- -p 3001
```

### ESLint

```bash
npm run lint
```

## 로드맵

1. 섹션별 페이지 퍼블리싱
2. Supabase(또는 지정 백엔드) 연동, `.env.example`·환경변수 문서
3. 인증·업로드·CRUD
4. 배포·CI 문서화 (`devops-agent` 협업)
5. 자동화 테스트 (`tester-agent` 협업)

## Agent 협업 (Cursor)

멀티 Agent 작업 시 `.cursor/rules/project-rules.mdc`를 따릅니다.

| 규칙 파일 | 역할 |
|-----------|------|
| `pm-agent.mdc` | 요구사항·작업 분해·커밋 컨벤션 (코드 수정 없음) |
| `frontend-agent.mdc` | UI, `app/**`, 헤더·반응형 |
| `backend-agent.mdc` | API, 서버, DB |
| `docs-agent.mdc` | README, `docs/**` |
| `reviewer-agent.mdc` | 읽기 전용 리뷰·머지 준비도 |
| `tester-agent.mdc` | 테스트·QA |
| `security-agent.mdc` | 보안 검토 |
| `devops-agent.mdc` | CI/CD·배포 설정 |

- 작업마다 `main`에서 **별도 브랜치** 생성
- 커밋·머지·푸시는 **사용자 명시 승인 후**
- 전문 Agent 세션은 해당 `.mdc`의 **세션 첫 프롬프트**로 시작 (PM이 별도 지시를 줄 수 있음)

## 기여 방법

1. `main`에서 직접 작업하지 않고 브랜치를 만듭니다 (`docs/...`, `design/...`, `feat/...` 등).
2. 변경 범위를 최소화합니다. 헤더·라우트 변경 시 [수동 검증](#수동-검증-헤더반응형)을 수행합니다.
3. 커밋 메시지: `type:short description` (콜론 뒤 공백 없음, 한 줄) — 상세는 `pm-agent.mdc`

| type | 용도 |
|------|------|
| `chore` | 설정, 의존성, 빌드 |
| `deploy` | 배포 설정 |
| `docs` | README, 가이드 |
| `feat` | 기능 |
| `hotfix` | 긴급 수정 |
| `design` | UI·CSS·퍼블리싱 |
| `fix` | 버그 |
| `style` | 포맷·오타·이름만 |
| `refactor` | 동작 유지 리팩터 |
| `rename` | 파일·폴더 이동 |
| `remove` | 삭제 |

**확인 필요:** CODEOWNERS, PR 템플릿, 이슈 라벨

## 라이선스

**확인 필요:** 루트 `LICENSE` 없음

---

## 확인 필요

| 항목 | 현재 상태 |
|------|-----------|
| 프로덕션·스테이징 URL | 미기재 |
| 배포 호스트·CI (Vercel 등) | 설정 파일 없음 |
| Supabase 등 env **실제 변수명** | 코드·`.env.example` 없음 |
| 인증·업로드 | 규칙 문서만 언급, 미구현 |
| `npm test` / E2E | 미구현 |
| Node 고정 버전 | `.nvmrc`·`engines` 없음 |
| `LICENSE` | 파일 없음 |
| CODEOWNERS·PR 템플릿 | 미기재 |

확정된 항목은 본문 해당 섹션으로 옮기고 이 표에서 제거하는 것을 권장합니다.

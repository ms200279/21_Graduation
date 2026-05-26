# 21st Graduation Online Exhibition

대학 졸업 전시 작품·인물·쇼룸 정보를 온라인으로 아카이브하고 탐색할 수 있게 하는 **졸업 온라인 전시 웹사이트**입니다.

## 개요

이 저장소는 **Next.js App Router** 기반의 프론트엔드 프로젝트입니다. 방문자는 랜딩 페이지와 네비게이션을 통해 Projects, People, Showroom, Credits 섹션으로 이동할 수 있으며, 각 섹션은 단계적으로 콘텐츠가 채워질 예정입니다.

| 항목 | 내용 |
|------|------|
| 패키지 이름 | `21stgraduation` |
| 현재 버전 | `0.1.0` |
| 기본 언어(UI) | 영문 (`layout.tsx` 메타데이터 기준) |

### 해결하려는 문제

- 오프라인 졸업 전시를 **지속 가능한 웹 아카이브**로 남긴다.
- 작품·참여자·쇼룸·크레딧 정보를 **한 사이트에서 일관된 UX**로 제공한다.
- 이후 Supabase 등 백엔드 연동 시 **인증·업로드·데이터 관리**를 같은 앱에서 확장할 수 있게 한다.

## 주요 기능

### 현재 구현됨 (코드 기준)

- **글로벌 헤더 네비게이션** (`app/components/Header.tsx`)
  - Projects / People / Showroom / Credits 4개 메뉴
  - 랜딩(`/`)에서 확장형 헤더 + 오브(orb) 애니메이션
  - 서브 페이지에서 축소 헤더, 호버 시 확장 및 현재 메뉴 라벨 이동
  - 메뉴 클릭 시 라벨 전환 애니메이션 후 라우팅
- **섹션별 라우트** (현재 페이지 본문은 퍼블리싱 준비용 빈 `main`)
  - `/` — 랜딩
  - `/projectspage` — Projects
  - `/peoplepage` — People
  - `/showroompage` — Showroom
  - `/creditspage` — Credits

### 계획·문서상 언급 (코드 미반영)

프로젝트 규칙(`.cursor/rules/project-rules.mdc`)에는 Supabase, 인증, 업로드 플로우가 언급되어 있으나, **현재 저장소에는 해당 패키지·API·환경변수 사용 코드가 없습니다.** 아래 [로드맵](#로드맵) 및 [확인 필요](#확인-필요)를 참고하세요.

## 기술 스택

| 구분 | 기술 | 버전(참고) |
|------|------|------------|
| 프레임워크 | [Next.js](https://nextjs.org/) (App Router) | 16.1.6 |
| UI | [React](https://react.dev/) | 19.2.3 |
| 스타일 | [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| 언어 | TypeScript | 5.x |
| 린트 | ESLint (`eslint-config-next`) | 9.x |
| 폰트 | `next/font` — Inter | — |

**확인 필요 (의존성·인프라)**

- **Supabase** — README·프로젝트 규칙에 명시, `package.json` 미포함
- **Vercel** — 배포 대상으로 가정 가능, 저장소 내 `vercel.json` 없음

## 데모 또는 스크린샷

**확인 필요:** 프로덕션 URL, 스크린샷 경로, 캡처 가이드

로컬 미리보기: 개발 서버 실행 후 [http://localhost:3000](http://localhost:3000)

## 시작하기

### 요구사항

- **Node.js** 20 LTS 권장 (`@types/node` ^20 기준)
- **npm** (또는 호환 패키지 매니저 — 아래 명령어는 npm 기준)

**확인 필요:** 팀에서 고정하는 Node/npm 버전(`.nvmrc`, `engines` 필드 등)

### 설치

```bash
git clone <저장소-URL>
cd 21stgraduation
npm install
```

### 환경변수 설정

현재 애플리케이션 코드에서 `process.env` / `NEXT_PUBLIC_*` 사용처는 **없습니다.**

로컬에서 Supabase 등을 연동할 때는 프로젝트 루트에 `.env.local`을 만들고, **`.gitignore`에 의해 커밋되지 않도록** 관리하세요.

**확인 필요 (연동 시 예상 항목 — 실제 이름·값은 팀/대시보드에서 확정)**

```bash
# 예시 템플릿 (값은 절대 README에 실제 secret을 넣지 마세요)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`.env.example` 파일이 저장소에 없으므로, 확정 후 `docs/` 또는 `.env.example` 추가를 권장합니다.

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

- `build`: 프로덕션 빌드 생성
- `start`: 빌드 결과로 서버 실행 (기본 포트 3000)

### 테스트

| 명령어 | 설명 |
|--------|------|
| `npm run lint` | ESLint 실행 (`eslint`) |

**확인 필요:** 단위/통합/E2E 테스트 프레임워크 및 `test` 스크립트 — 현재 `package.json`에 없음

## 사용 방법

### 방문자 흐름

1. 랜딩(`/`)에서 헤더·오브 UI 확인
2. 헤더에서 **Projects / People / Showroom / Credits** 선택
3. 각 경로에서 해당 섹션 콘텐츠 확인 (현재는 레이아웃·네비게이션 중심)

### 개발 시 경로 별칭

`tsconfig.json`에 `@/*` → 프로젝트 루트 매핑이 설정되어 있습니다.

```ts
import Something from "@/app/components/Example";
```

## 프로젝트 구조

```
21stgraduation/
├── app/
│   ├── components/
│   │   └── Header.tsx      # 글로벌 네비게이션·전환 애니메이션
│   ├── creditspage/
│   │   └── page.tsx        # /creditspage
│   ├── peoplepage/
│   │   └── page.tsx        # /peoplepage
│   ├── projectspage/
│   │   └── page.tsx        # /projectspage
│   ├── showroompage/
│   │   └── page.tsx        # /showroompage
│   ├── favicon.ico
│   ├── globals.css         # 전역 스타일·Tailwind
│   ├── layout.tsx          # 루트 레이아웃·메타데이터·Header
│   └── page.tsx            # / (랜딩)
├── public/                 # 정적 자산 (현재 비어 있음)
├── .cursor/rules/          # Cursor 프로젝트 규칙
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```

## 주요 명령어

| 명령어 | 용도 |
|--------|------|
| `npm run dev` | 개발 서버 (핫 리로드) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

## API 문서

**해당 없음 (현재).** Next.js Route Handler / Server Actions / 외부 REST API 구현이 저장소에 없습니다.

Supabase 연동 후에는 `docs/api.md` 등 별도 문서 분리를 권장합니다.

## 환경변수

| 변수명 | 필수 여부 | 설명 |
|--------|-----------|------|
| — | — | 코드베이스에 사용 중인 환경변수 없음 |

연동 시 표는 [환경변수 설정](#환경변수-설정) 및 팀 문서로 보강하세요. **실제 키·토큰은 README에 기재하지 마세요.**

## 배포

일반적인 **Vercel + Next.js** 배포 흐름을 가정할 수 있습니다.

1. 저장소를 Vercel(또는 호스트)에 연결
2. 빌드 명령: `npm run build`
3. 출력: Next.js 기본 설정
4. 환경변수는 호스트 대시보드에 등록 (`.env.local`과 동일 키 이름 사용)

**확인 필요**

- 실제 배포 URL·브랜치 전략(preview/production)
- Vercel 프로젝트 ID, 도메인, 환경별 변수 목록

## 트러블슈팅

### `npm install` / `npm run build` 실패

- Node 버전을 20 LTS대로 맞춘 뒤 `node_modules` 삭제 후 재설치:

```bash
rm -rf node_modules .next
npm install
npm run build
```

### 포트 3000이 이미 사용 중

```bash
npm run dev -- -p 3001
```

**확인 필요:** 팀 표준 포트·프록시 설정

### ESLint 오류

```bash
npm run lint
```

규칙은 `eslint.config.mjs` 및 `eslint-config-next`를 따릅니다.

## 로드맵

프로젝트 규칙·기존 README를 바탕으로 한 **예상 순서**입니다 (구현 여부는 이슈/PR로 확인).

1. 섹션별 페이지 콘텐츠 퍼블리싱 (Projects, People, Showroom, Credits)
2. Supabase 프로젝트 연동 및 환경변수·`.env.example` 정리
3. 인증·업로드·데이터 CRUD
4. Vercel(또는 지정 호스트) 프로덕션 배포
5. 테스트 스크립트·CI 문서화

## 기여 방법

1. `main`에서 직접 작업하지 않고 **기능/문서별 브랜치**를 만듭니다.
2. 변경 범위를 최소화하고, 기존 인증·Supabase·업로드 동작을 깨지 않도록 합니다.
3. 커밋 메시지 형식: `type:short description`

| type | 용도 예시 |
|------|-----------|
| `docs` | README, 가이드 |
| `feat` | 기능 추가 |
| `design` | UI·퍼블리싱 |
| `fix` | 버그 수정 |
| `chore` | 설정·의존성 |

**확인 필요:** CODEOWNERS, PR 템플릿, 이슈 라벨 규칙

## 라이선스

**확인 필요:** 저장소 루트에 `LICENSE` 파일이 없습니다. 배포·재사용 정책 확정 후 본 섹션을 업데이트하세요.

---

## 확인 필요

문서와 코드를 대조했을 때, 아래는 **추가 확인 없이 사실로 단정하지 않은 항목**입니다.

| 항목 | 현재 상태 |
|------|-----------|
| Supabase URL·anon key 등 환경변수 **실제 이름** | 코드·`.env.example` 없음 |
| 인증·업로드 플로우 | 프로젝트 규칙에만 언급 |
| 프로덕션·스테이징 URL | 미기재 |
| 데모 URL·스크린샷 | 미기재 |
| 테스트 프레임워크·`npm test` | 미구현 |
| Node.js 고정 버전(`.nvmrc`, `engines`) | 미정의 |
| 라이선스 | `LICENSE` 파일 없음 |
| clone URL | `<저장소-URL>` 플레이스홀더 |

확인이 끝나면 위 표 항목을 본문 해당 섹션으로 옮기고, 이 섹션에서 제거하는 것을 권장합니다.

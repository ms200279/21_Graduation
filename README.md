# 21st Graduation Online Exhibition

Tech University of Korea(TUK) 21st 졸업 전시를 온라인으로 아카이브·소개하는 **졸업 온라인 전시 웹사이트**입니다.

## 개요

**Next.js App Router** 기반 프론트엔드 프로젝트입니다. 랜딩(`/`)에는 **Hero · Concept Carousel · Media · Footer** 풀페이지 스크롤과 Liquid Glass UI가 구현되어 있고, Projects / People / Showroom / Credits 서브 페이지는 **네비게이션·헤더 중심**으로 본문 퍼블리싱이 남아 있습니다.

| 항목 | 내용 |
|------|------|
| 패키지 이름 | `21stgraduation` |
| 현재 버전 | `0.1.0` |
| 저장소 | [https://github.com/ms200279/21_Graduation](https://github.com/ms200279/21_Graduation) |
| 사이트 타이틀 | `sensibility` (`layout.tsx` metadata) |
| UI 언어 | 영문·한국어 혼용 |

### 해결하려는 문제

- 오프라인 졸업 전시를 **지속 가능한 웹 아카이브**로 남긴다.
- 전시 컨셉·일정·소개·작품 인덱스를 **한 사이트에서 일관된 UX**로 제공한다.
- 이후 백엔드 연동 시 **인증·업로드·데이터 관리**를 같은 앱에서 확장할 수 있게 한다.

## 주요 기능

### 라우트

| 경로 | 상태 | 설명 |
|------|------|------|
| `/` | 구현됨 | Hero · Concept Carousel · Media · Footer 스냅 스크롤 |
| `/projectspage` | 본문 준비 중 | Projects |
| `/peoplepage` | 본문 준비 중 | People |
| `/showroompage` | 본문 준비 중 | Showroom |
| `/creditspage` | 본문 준비 중 | Credits |

### 랜딩 페이지 (`app/page.tsx`)

| 섹션 | 파일 | 설명 |
|------|------|------|
| 스크롤 컨테이너 | `LandingScrollExperience.tsx` | Hero ↔ Concept ↔ Media 스냅 + Media에서 Footer 패널 reveal |
| Hero | `page.tsx`, `LandingHeroActionButton.tsx` | `/images/bg.webm` 루프 비디오, 전시 일정·장소 카피, **Schedule / Info** Liquid Glass 버튼 |
| Concept | `landing-carousel/LandingCarousel.tsx` | 4슬라이드 Concept 캐러셀 (`slides.ts` 데이터) |
| Media | `page.tsx` | 흰색 풀뷰포트 플레이스홀더 (콘텐츠 추후) |
| Footer | `LandingFooter.tsx` | 브랜드·Instagram·섹션 링크·저작권 |

**섹션 스크롤 순서**

1. **Hero** (`scrollProgress` 0)
2. **Concept** — 캐러셀 (`scrollProgress` 1)
3. **Media** — 미디어 영역 (`scrollProgress` 2)
4. **Footer** — Media 섹션에서 추가 스크롤 시 뷰포트 **40%** 높이로 스냅 reveal (`LANDING_FOOTER_VIEWPORT_RATIO`)

**Concept 캐러셀 슬라이드** (`slides.ts` → `CONCEPT_CAROUSEL_SLIDES`)

| id | title | 내용 요약 |
|----|-------|-----------|
| `concept` | Concept | `'Sensibility'` — 전시 컨셉 카피 (한국어) |
| `typography` | Typography | 타이포 이미지 (`/icons/typo.svg`) + 설명 |
| `symbol` | Symbol | Navy / Black / Outlined 심볼 아이콘 + 설명 |
| `senses` | Senses | 제목만 (본문 추후) |

슬라이드 UI: `ConceptCarouselSlideContent.tsx`, `SymbolCarouselIcons.tsx`

**스크롤·헤더 연동 (랜딩, 데스크톱)**

- `scrollProgress` **0–1**: Hero ↔ Concept — 헤더 **오브** 바깥↔안쪽 전환, 네비 접힘/펼침
- `scrollProgress` **≥ 1**: Concept 이후 — Concept ↔ Media·Footer 이동 시 **헤더 전환 없이** 스크롤만
- 스크롤 **업**: 헤더 즉시 펼침 / **다운**: 오브·네비 접힘
- Concept·Media·Footer에서 **오브 클릭**: Hero(top)로 스크롤 + 필요 시 헤더 강제 펼침
- 서브 페이지에서 **오브 클릭**: `/`로 이동

### 글로벌 UI

| 구성 | 파일 | 설명 |
|------|------|------|
| 타이포 로고 | `TypoLogoButton.tsx` | `/icons/typo.svg`, Hero 카피 좌측 정렬, 랜딩 top 스크롤 |
| 헤더 | `Header.tsx` | 반응형 네비 + Liquid Glass morph + 오브·스크롤 연동 |
| Liquid Glass | `liquid-glass/useLiquidGlass.ts` | 헤더 nav·오브, Hero Action 버튼 backdrop-filter 굴절 |
| Footer | `LandingFooter.tsx` | Instagram [@tukd_grad](https://www.instagram.com/tukd_grad/), Projects/People/Showroom/Credits 링크 |

### 글로벌 헤더 (`Header.tsx` + `globals.css`)

#### 모바일 (뷰포트 ≤ 767px)

- `matchMedia("(max-width: 767px)")` 분기
- 우측 상단 pill (`right-4 top-4`, `h-[44px]`)
- **랜딩**: 햄버거 탭 → 메뉴 확장
- **서브 페이지**: 현재 라벨 pill 탭 → 확장; 바깥 `pointerdown` 시 닫힘
- 라벨 **`font-bold` + `text-systemNavy`**

#### 데스크톱 (뷰포트 ≥ 768px)

- 상단 중앙, `.desktop-header` CSS 변수 (`globals.css` 768 / 1024 / 1280px)
- Liquid Glass nav + **심볼 오브** (`/icons/symbol.svg`) 클릭 가능
- **랜딩**: [스크롤·헤더 연동](#랜딩-페이지-apppagetsx) 참고
- **서브 페이지**: 축소 pill → `md:` 호버 확장; **`font-bold text-systemNavy`**
- **1024px+(`lg:`)**: flex 가로 네비
- 메뉴 클릭: 라벨 전환(700ms) 후 `router.push`

### 반응형·브레이크포인트

| 구분 | 기준 | 적용 위치 |
|------|------|-----------|
| JS 모바일 | `max-width: 767px` | `Header.tsx` |
| Tailwind `md:` | `min-width: 768px` | 호버 확장, Hero·캐러셀 타이포 |
| Tailwind `lg:` | `min-width: 1024px` | 데스크톱 flex 네비 |
| `.desktop-header` 변수 | 768 / 1024 / 1280px | `globals.css` |

### 백엔드·데이터 (미구현)

`package.json`에 Supabase 클라이언트가 없고, 코드에 `process.env` 사용처가 없습니다.

## 기술 스택

| 구분 | 기술 | 버전(참고) |
|------|------|------------|
| 프레임워크 | [Next.js](https://nextjs.org/) (App Router) | 16.1.6 |
| UI | [React](https://react.dev/) | 19.2.3 |
| 스타일 | [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| 언어 | TypeScript | 5.x |
| 린트 | ESLint (`eslint-config-next`) | 9.x |
| 폰트 | `next/font/local` — Pretendard Variable | `public/fonts/PretendardVariable.woff2` |

## 데모 또는 스크린샷

로컬: `npm run dev` → [http://localhost:3000](http://localhost:3000)

**확인 필요:** 프로덕션 URL, 스크린샷 자산

## 시작하기

### 요구사항

- **Node.js** 20 LTS 권장 (`@types/node` ^20)
- **npm**

### 설치

```bash
git clone https://github.com/ms200279/21_Graduation.git
cd 21_Graduation
npm install
```

### 환경변수

애플리케이션 코드에 **사용 중인 환경변수 없음.**

### 개발 서버

```bash
npm run dev
```

### 빌드

```bash
npm run build
npm run start
```

### 테스트·품질 검사

| 명령어 | 설명 |
|--------|------|
| `npm run lint` | ESLint |

**확인 필요:** `npm test` — `package.json`에 없음

### 수동 검증

1. **랜딩 스냅**: Hero → Concept → Media, Media에서 Footer reveal(40vh)
2. **Hero**: WebM 배경, Schedule/Info 확장·collapse, Liquid Glass
3. **Concept 캐러셀**: 4슬라이드(Concept/Typography/Symbol/Senses), prev/next·dot
4. **Footer**: Instagram 링크, 섹션 네비 링크
5. **헤더·오브**: Hero↔Concept 구간 morph; Concept 이후 오브 클릭 → Hero
6. **모바일(≤767px)**: 햄버거·pill 탭
7. **데스크톱(≥768px)**: 호버 확장, 볼드 라벨, 라우트 전환

## 사용 방법

### 방문자

1. Hero에서 전시 정보·Schedule/Info 확인
2. 스크롤로 Concept 캐러셀·Media·Footer 탐색
3. 헤더 또는 Footer 링크로 Projects / People / Showroom / Credits 이동

### 개발자

- 경로 별칭: `@/*` → 프로젝트 루트
- 랜딩 스크롤: `LandingScrollExperience`, `scrollLandingFullpageTo`, `--landing-scroll-progress`
- 캐러셀 데이터: `app/components/landing-carousel/slides.ts`
- 헤더·오브: `Header.tsx`, `globals.css` `.desktop-header`
- Liquid Glass: `useLiquidGlass.ts`, `app/styles/liquid-glass.css`
- Agent 규칙: `.cursor/rules/` (`project-rules.mdc`)

## 프로젝트 구조

```
21_Graduation/
├── app/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── TypoLogoButton.tsx
│   │   ├── LandingScrollExperience.tsx   # Hero/Concept/Media/Footer 스냅
│   │   ├── LandingHeroActionButton.tsx
│   │   ├── LandingFooter.tsx
│   │   ├── landing-carousel/
│   │   │   ├── LandingCarousel.tsx
│   │   │   ├── ConceptCarouselSlideContent.tsx
│   │   │   ├── SymbolCarouselIcons.tsx
│   │   │   ├── slides.ts                 # CONCEPT_CAROUSEL_SLIDES
│   │   │   └── index.ts
│   │   └── liquid-glass/
│   │       ├── useLiquidGlass.ts
│   │       ├── liquidGlassFilter.ts
│   │       └── index.ts
│   ├── styles/
│   │   └── liquid-glass.css
│   ├── creditspage/page.tsx
│   ├── peoplepage/page.tsx
│   ├── projectspage/page.tsx
│   ├── showroompage/page.tsx
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   └── page.tsx                          # Hero / Concept / Media + Footer
├── public/
│   ├── fonts/PretendardVariable.woff2
│   ├── icons/symbol.svg
│   ├── icons/typo.svg
│   └── images/bg.webm
├── .cursor/rules/
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

**해당 없음 (현재).**

## 배포

저장소에 `vercel.json`, CI 워크플로 없음. Build: `npm run build` / Start: `npm run start`.

**확인 필요:** 배포 호스트·URL

## 트러블슈팅

```bash
rm -rf node_modules .next && npm install && npm run build
npm run dev -- -p 3001   # 포트 충돌
npm run lint
```

## 로드맵

1. ~~랜딩 Hero · Concept Carousel · Media/Footer 스크롤~~ (구현됨)
2. Media 섹션 콘텐츠, Senses 슬라이드 본문
3. Projects / People / Showroom / Credits 페이지 퍼블리싱
4. Supabase(또는 지정 백엔드) 연동
5. 배포·CI·자동화 테스트

## Agent 협업 (Cursor)

`.cursor/rules/project-rules.mdc` 및 각 Agent `.mdc` **세션 첫 프롬프트** 참고.

- 작업마다 `main`에서 별도 브랜치
- 커밋 형식: `type:short description` (`pm-agent.mdc`)

## 기여 방법

1. `main`에서 브랜치 생성
2. 랜딩·헤더 변경 시 [수동 검증](#수동-검증) 수행
3. `npm run lint` (라우팅·레이아웃 변경 시 `npm run build` 권장)

| type | 용도 |
|------|------|
| `chore` | 설정, 의존성 |
| `deploy` | 배포 |
| `docs` | README, 가이드 |
| `feat` | 기능 |
| `hotfix` | 긴급 수정 |
| `design` | UI·CSS |
| `fix` | 버그 |
| `style` | 포맷·오타 |
| `refactor` | 리팩터 |
| `rename` | 이동 |
| `remove` | 삭제 |

## 라이선스

**확인 필요:** `LICENSE` 없음

---

## 확인 필요

| 항목 | 현재 상태 |
|------|-----------|
| 프로덕션·스테이징 URL | 미기재 |
| 배포 호스트·CI | 설정 없음 |
| Media 섹션 콘텐츠 | `bg-white` 플레이스홀더 |
| `senses` 슬라이드 본문 | `paragraphs: []` |
| Supabase·인증·업로드 | 미구현 |
| `npm test` / E2E | 미구현 |
| `LICENSE` | 없음 |

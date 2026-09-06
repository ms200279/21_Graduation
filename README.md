# 21st Graduation Online Exhibition

한국공학대학교 디자인공학부 제21회 졸업전시 **sensibility**의 온라인 전시 웹사이트입니다. 전시 정보, 작품과 참여자 아카이브, 인터랙티브 쇼룸, 크레딧을 하나의 Next.js App Router 애플리케이션으로 제공합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | Next.js 16.3.0 (App Router) |
| UI | React 19.2.3 |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS 4, CSS modules, global CSS |
| 3D | Three.js 0.185 |
| Font | Pretendard Variable (`next/font/local`) |
| Validation | TypeScript, ESLint 9, Vitest, Playwright, Next.js production build |
| Deployment | Vercel 연동 |

현재 Supabase 클라이언트, 인증, API route, 환경변수 의존성은 없습니다.

## 주요 라우트

| 경로 | 렌더링 | 설명 |
| --- | --- | --- |
| `/` | Static | Hero, Concept 캐러셀, Media, Footer 스크롤 경험 |
| `/projectspage` | Static | 77개 작품의 실린더/그리드 갤러리 |
| `/projectspage/[projectId]` | SSG | 작품 상세 portal과 정적 작품 경로 |
| `/peoplepage` | Static | 참여자 로테이팅 캐러셀 |
| `/peoplepage/[memberId]` | Dynamic | 선택한 참여자 확대 상태 |
| `/showroompage` | Static | 입력 문구로 변형되는 Canvas 파티클 타이포 |
| `/creditspage` | Static | 5개 Three.js 크레딧 파편의 조립 상태 |
| `/creditspage/[fragmentSlug]` | SSG | 선택한 크레딧 파편과 본문 |

## 페이지별 기능

### Landing

- `/images/bg.webm`, `/images/bg2.webm` 비디오 배경
- Hero, Concept, Media 사이의 풀페이지 스크롤과 Footer reveal
- Schedule/Info Liquid Glass 패널
- 토요일 `10:00-17:30`, 일요일 `10:00-17:00` 전시 시간 표시
- Concept, Typography, Symbol, Senses 캐러셀
- Senses 카드의 카테고리 필름(`/images/categori-player.webm`) 재생/정지
- Media 섹션의 메인 필름(`/images/landing-main-player.webm`)
- 스크롤 진행도와 연동되는 글로벌 Header/Orb 전환

관련 파일:

- `app/page.tsx`
- `app/components/LandingScrollExperience.tsx`
- `app/components/LandingHeroActionButton.tsx`
- `app/components/landing-carousel/**`

### Projects

- 77개 작품 카드와 Vercel Blob 작품 이미지
- 12개 슬롯으로 구성된 상하 실린더, 서로 반대 방향 자동 회전
- 휠, 좌우 버튼, hover 기준 스냅
- 화면 뒤쪽에서 카드를 교체하는 비중복 순환 덱
- 실린더/그리드 보기 전환
- 카드 hover 시 작품명과 한 줄 소개
- 16:9 반응형 카드

구성 분리:

- `ProjectsPageContent.tsx`: 카테고리와 보기 모드 상태, 갤러리 조합
- `ProjectsCylinderGallery.tsx` / `CylinderRow.tsx`: 실린더 입력과 렌더링
- `ProjectsGridGallery.tsx`: 그리드 보기
- `projectsCylinderConfig.ts`: 실린더 상수와 배치 설정
- `projectsGalleryModel.ts`, `useProjectsDeckState.ts`: 필터링, 덱, 스냅 모델
- `projectData.ts`: 검증된 원본 데이터를 화면용 상세/요약 모델로 변환
- `projectDataSchema.ts`: `app/data/projectinfo.json`의 런타임 스키마 검증
- `projectImages.ts`: 작품 번호와 Blob 이미지 경로 매핑
- `projects-cylinder-gallery.css`: 실린더와 그리드 레이아웃

`projectspage/layout.tsx`는 갤러리를 상세 route 바깥으로 remount하지 않고 유지합니다. 따라서 상세 portal을 열고 닫아도 카테고리, 보기 모드, 실린더 위치와 문서 스크롤이 보존됩니다.

### People

- `/images/ppbg.webm` 전체 화면 배경
- `app/data/people.json`의 98명 참여자 명단
- `app/data/people-images.json`의 프로필 사진을 이름으로 매칭
- 한글 이름순 정렬
- Everyone / Industrial Design / Media Design 학과 필터
- 한글 이름 부분 일치 검색, Enter 후에도 결과 유지
- 원통형 참여자 카드와 진입 stagger 애니메이션
- zone 카드의 hover tilt와 클릭 확대
- 휠 종류를 구분한 스크롤/스냅 처리
- `/peoplepage/[memberId]` 라우트와 확대 상태 동기화
- Footer reveal 구간의 스크롤 handoff

구성 분리:

- `PeoplePageContent.tsx`: 학과 필터와 검색 상태
- `PeopleRotatingCarousel.tsx`: React 상태, 이벤트, 렌더링
- `PeopleCarouselCard.tsx`, `PeopleCarouselExpandedPortal.tsx`: 카드와 확대 portal
- `PeoplePageShell.tsx`: 페이지 배경과 콘텐츠 조합
- `peopleCarouselModel.ts`: 측정값 타입, 좌표/스냅 계산, 검색 결과 1명일 때 카드 유지
- `usePeopleCarouselMeasurements.ts`, `peopleCarouselWheelSnapEvents.ts`: 측정과 휠 스냅
- `usePeopleCarouselRouteSync.ts`: 확대 상태와 동적 route 동기화
- `items.ts`: 검증된 명단을 화면용 카드 모델로 변환
- `peopleDataSchema.ts`: `app/data/people.json` 런타임 검증
- `peopleImages.ts`: `app/data/people-images.json` 이름 매칭
- `peopleCategories.ts`: 학과 태그 매핑
- `peopleSearch.ts`: 한글 이름 검색과 필터 조합
- `memberPaths.ts`: 참여자 URL 변환
- `peopleCarouselFooter.ts`: Footer 스크롤 연동

검색은 이름에 포함된 한글 음절만 사용합니다. 초성, 전화번호, 영어 입력은 검색어로 쓰지 않습니다.

### Showroom

- 검은 배경 위 Canvas 파티클 타이포
- 초기 문구 `Flexibility through Sensibility.`
- 첫 입력 focus 시 초기 문구 자동 삭제, Enter 제출 시 파티클 변형
- 포인터 주변 파티클 반응
- `해파리` 입력 시 해파리 실루엣 생성
- 오감 키워드와 졸업전시 이스터에그 설명

구성 분리:

- `ParticleTextScene.tsx`: Canvas 수명주기와 입력 UI
- `particleTextContent.ts`: 초기 문구, 감각 설명, 이스터에그 데이터
- `ParticleTextScene.module.css`: Showroom 전용 스타일

### Credits

- 동일 평면에서 하나의 패널을 이루는 5개 polygon fragment
- fragment별 이미지(`/images/cti1.png`-`cti5.png`)와 liquid glass shader
- idle drift, pointer parallax, hover tilt
- 선택 시 파편 이동과 route 전환, 본문 overlay 연결
- Archive 파편의 인터뷰 필름(`/images/interview-player.webm`)
- ESC/닫기 복귀 및 reduced-motion 대응
- 크레딧 본문과 조직도를 DOM으로 제공

크레딧 데이터는 `creditData.ts`에 분리되어 있고, scene 구성은 `creditSceneSetup.ts`, `creditSceneGeometry.ts`, `creditSceneMaterial.ts`, `creditSceneResources.ts`, `creditSceneMath.ts`로 나뉩니다. `creditspage/layout.tsx`는 선택 route가 바뀌어도 Three.js scene과 선택 애니메이션 상태를 유지합니다. 조직도는 위원장단을 먼저 표시하고 `기획팀 → 디자인팀 → 웹사이트팀 → 총무팀 → 홍보팀` 순서로 구성합니다.

## 공통 UI

- `Header.tsx`: 데스크톱 hover, 모바일 touch, route transition
- `TypoLogoButton.tsx`: 상단 타이포 로고와 랜딩 복귀
- `GlobalFooterReveal.tsx`: 페이지별 Footer reveal 및 스크롤 잠금
- `SitePageShell.tsx`: Showroom 진입/이탈 배경 전환
- `liquid-glass/**`: SVG filter와 Liquid Glass hook
- `app/utils/numbers.ts`: 공통 숫자 범위 제한 유틸리티

전역 reset, theme token, font, `html`/`body` 기본값은 `app/globals.css`에만 둡니다. Root layout이 `landing.css` → `site-page-shell.css` → `landing-footer.css` → `site-header.css` → `category-filter-buttons.css` 순서로 공통 스타일을 불러와 cascade 순서를 고정합니다. People/Projects 필터는 `category-filter-buttons.css`의 공통 visual layer와 각 페이지 CSS의 변수/레이아웃 규칙을 조합합니다.

## 반응형 기준

| 범위 | 주요 동작 |
| --- | --- |
| `<= 767px` | 모바일 Header/touch UI, 축소된 3D composition, hover 비의존 동작 |
| `>= 768px` | 데스크톱 Header hover, pointer parallax/tilt |
| `>= 1024px` | 넓은 화면용 캐러셀과 Header 레이아웃 |
| `>= 1536px` | 데스크톱 Projects 카드 크기 조정 |

CSS의 `dvh`, `clamp()`, aspect ratio와 JavaScript의 `matchMedia`를 함께 사용합니다. 고정 형식의 카드와 Canvas는 viewport 변화 시 내부 크기와 카메라/좌표를 다시 계산합니다.

## 성능과 접근성

- Canvas 및 Three.js renderer pixel ratio를 제한합니다.
- 애니메이션 루프는 React state의 프레임 단위 갱신을 피하고 ref/object property를 사용합니다.
- `requestAnimationFrame`, timer, observer, event listener는 unmount 시 정리합니다.
- Three.js geometry, material, texture, renderer를 dispose합니다.
- `prefers-reduced-motion`에서 큰 이동과 idle motion을 축소합니다.
- 실제 Credit 본문은 WebGL mesh가 아니라 DOM에 유지합니다.
- icon-only button은 `aria-label`, 상태형 button은 `aria-pressed`를 사용합니다.

## 프로젝트 구조

```text
app/
├── components/
│   ├── credits/
│   ├── landing-carousel/
│   ├── liquid-glass/
│   ├── people-carousel/
│   ├── projects/
│   ├── showroom/
│   ├── GlobalFooterReveal.tsx
│   ├── Header.tsx
│   ├── LandingScrollExperience.tsx
│   └── SitePageShell.tsx
├── data/
│   ├── people-images.json
│   ├── people.json
│   ├── projectImages.ts
│   └── projectinfo.json
├── creditspage/
├── peoplepage/
├── projectspage/
├── showroompage/
├── styles/
├── utils/
├── globals.css
├── layout.tsx
└── page.tsx
public/
├── fonts/
├── icons/
└── images/
```

## 시작하기

### 요구사항

- Node.js 24.x (`package.json`의 `engines.node`)
- npm

### 설치 및 실행

```bash
npm install
npm run dev
```

기본 개발 주소는 [http://localhost:3000](http://localhost:3000)입니다.

### 검증

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Vitest는 모델, route, 데이터 스키마 단위 테스트를 실행합니다. Playwright는 데스크톱·모바일의 주요 route와 Landing 스크롤, Projects 필터·상세 상태, People 확대, Showroom 입력, Credits 상세 닫기를 검증합니다.

## 수동 QA

1. Hero에서 Concept/Media/Footer까지 스크롤하고 Header 전환을 확인합니다.
2. Senses 카드와 Media 섹션에서 영상을 재생/정지합니다.
3. Schedule/Info 패널과 모바일 Header touch 동작을 확인합니다.
4. Projects 두 실린더의 자동 회전, 휠, 버튼, hover snap, 그리드 전환을 확인합니다.
5. People 학과 필터, 한글 이름 검색, zone snap, 확대/닫기, 동적 URL을 확인합니다.
6. Showroom 초기 morph, 입력 제출, 오감 설명, 해파리 실루엣을 확인합니다.
7. Credits hover/click/ESC, fragment route, Archive 인터뷰 영상, 긴 본문 스크롤을 확인합니다.
8. `<= 767px`, `768px`, `1024px`, `1536px` 전후 viewport를 확인합니다.
9. reduced-motion 환경에서 콘텐츠 접근이 가능한지 확인합니다.

## 트러블슈팅

### `Module not found`

파일명의 대소문자와 barrel export(`index.ts`)를 확인한 뒤 `.next` 캐시를 제거하고 다시 빌드합니다.

```bash
rm -rf .next
npm run build
```

### 타입 오류 `TS2304: Cannot find name ...`

리팩터링으로 유틸리티를 이동한 경우 export/import 누락 여부를 확인합니다. `npm run build`는 ESLint 이후 TypeScript 검사를 수행하므로 최종 검증에 반드시 포함합니다.

### 개발 포트 충돌

```bash
npm run dev -- -p 3001
```

포트 번호만으로 실행 중인 프로젝트를 판단하지 말고 터미널의 working directory와 Next.js 로그를 함께 확인합니다.

### 애니메이션이 즉시 완료되는 경우

운영체제의 reduced-motion 설정, `matchMedia("(prefers-reduced-motion: reduce)")`, 브라우저 탭 visibility를 확인합니다.

### WebGL 화면이 비어 있는 경우

브라우저 WebGL 지원, Canvas 크기, texture 경로, renderer cleanup 시점을 확인합니다. Credits 정보는 WebGL 실패 시에도 DOM에 남도록 유지해야 합니다.

## 데이터와 남은 작업

- Projects는 `app/data/projectinfo.json`과 Vercel Blob 이미지를 사용합니다.
- People은 `app/data/people.json`의 이름, 전화번호, 학과를 사용합니다.
- 참여자 사진은 `app/data/people-images.json`을 이름으로 매칭하며, 동명이인은 학번으로 구분합니다.
- 프로필 파일은 `public/people/{학번}_{이름}.png`에 있습니다. 문기돈, 정해인은 원본 사진이 없습니다.
- Landing Media의 Film 02/03 슬롯은 비어 있습니다.
- Supabase, 인증, 업로드, 관리자 기능은 구현되지 않았습니다.
- `LICENSE` 파일은 없습니다.

원본 대용량 영상(`main.webm`, `interview.webm`, `categori.webm`)은 재생용 `*-player.webm`으로 압축해 사용합니다.

## 배포

Vercel Git 연동을 사용하며 별도 `vercel.json`과 GitHub Actions workflow는 없습니다.

```bash
npm run build
```

프로덕션 반영 전 Vercel preview, 모바일/데스크톱 수동 QA, route transition을 확인합니다.

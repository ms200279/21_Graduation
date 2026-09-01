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
| Validation | ESLint 9, Next.js production build |
| Deployment | Vercel 연동 |

현재 Supabase 클라이언트, 인증, API route, 환경변수 의존성은 없습니다.

## 주요 라우트

| 경로 | 렌더링 | 설명 |
| --- | --- | --- |
| `/` | Static | Hero, 전시 정보, Concept 캐러셀, Media, Footer 스크롤 경험 |
| `/projectspage` | Static | 77개 작품의 실린더/그리드 갤러리 |
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
- 스크롤 진행도와 연동되는 글로벌 Header/Orb 전환

관련 파일:

- `app/page.tsx`
- `app/components/LandingScrollExperience.tsx`
- `app/components/LandingHeroActionButton.tsx`
- `app/components/landing-carousel/**`

### Projects

- 77개 작품 카드
- 12개 슬롯으로 구성된 상하 실린더, 서로 반대 방향 자동 회전
- 휠, 좌우 버튼, hover 기준 스냅
- 화면 뒤쪽에서 카드를 교체하는 비중복 순환 덱
- 실린더/그리드 보기 전환
- 16:9 반응형 카드

구성 분리:

- `ProjectsCylinderGallery.tsx`: React 상태, 입력 이벤트, 렌더링
- `projectsCylinderConfig.ts`: 카드 덱, 회전 상수, 각도/스냅 계산
- `projects-cylinder-gallery.css`: 실린더와 그리드 레이아웃

### People

- `/images/ppbg.webm` 전체 화면 배경
- 원통형 참여자 카드와 진입 stagger 애니메이션
- zone 카드의 hover tilt와 클릭 확대
- 휠 종류를 구분한 스크롤/스냅 처리
- `/peoplepage/[memberId]` 라우트와 확대 상태 동기화
- Footer reveal 구간의 스크롤 handoff

구성 분리:

- `PeopleRotatingCarousel.tsx`: React 상태, 이벤트, 렌더링
- `peopleCarouselModel.ts`: 측정값 타입, 좌표/스냅 계산, 애니메이션 설정
- `items.ts`: 참여자 데이터
- `memberPaths.ts`: 참여자 URL 변환
- `peopleCarouselFooter.ts`: Footer 스크롤 연동

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
- ESC/닫기 복귀 및 reduced-motion 대응
- 크레딧 본문과 조직도를 DOM으로 제공

크레딧 데이터는 `creditData.ts`에 분리되어 있습니다. 조직도는 위원장단을 먼저 표시하고 `기획팀 → 디자인팀 → 웹사이트팀 → 총무팀 → 홍보팀` 순서로 구성합니다.

## 공통 UI

- `Header.tsx`: 데스크톱 hover, 모바일 touch, route transition
- `TypoLogoButton.tsx`: 상단 타이포 로고와 랜딩 복귀
- `GlobalFooterReveal.tsx`: 페이지별 Footer reveal 및 스크롤 잠금
- `SitePageShell.tsx`: Showroom 진입/이탈 배경 전환
- `liquid-glass/**`: SVG filter와 Liquid Glass hook
- `app/utils/numbers.ts`: 공통 숫자 범위 제한 유틸리티

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

- Node.js 20 이상 권장
- npm

### 설치 및 실행

```bash
npm install
npm run dev
```

기본 개발 주소는 [http://localhost:3000](http://localhost:3000)입니다.

### 검증

```bash
npm run lint
npm run build
npm run start
```

별도의 `npm test` 또는 E2E 스크립트는 아직 없습니다.

## 수동 QA

1. Hero에서 Concept/Media/Footer까지 스크롤하고 Header 전환을 확인합니다.
2. Schedule/Info 패널과 모바일 Header touch 동작을 확인합니다.
3. Projects 두 실린더의 자동 회전, 휠, 버튼, hover snap, 그리드 전환을 확인합니다.
4. People 진입 애니메이션, zone snap, 확대/닫기, 동적 URL을 확인합니다.
5. Showroom 초기 morph, 입력 제출, 오감 설명, 해파리 실루엣을 확인합니다.
6. Credits hover/click/ESC, fragment route, 긴 본문 스크롤을 확인합니다.
7. `<= 767px`, `768px`, `1024px`, `1536px` 전후 viewport를 확인합니다.
8. reduced-motion 환경에서 콘텐츠 접근이 가능한지 확인합니다.

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

- Projects와 People은 현재 로컬 데이터로 렌더링합니다.
- Credit `Archive` 본문과 일부 작품/참여자 실제 데이터는 교체가 필요할 수 있습니다.
- Landing Media 영역은 현재 콘텐츠 placeholder입니다.
- Supabase, 인증, 업로드, 관리자 기능은 구현되지 않았습니다.
- 자동화 테스트와 `LICENSE` 파일은 없습니다.

## 배포

Vercel Git 연동을 사용하며 별도 `vercel.json`과 GitHub Actions workflow는 없습니다.

```bash
npm run build
```

프로덕션 반영 전 Vercel preview, 모바일/데스크톱 수동 QA, route transition을 확인합니다.

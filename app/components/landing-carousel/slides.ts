export type SymbolHeadingVariant = "navy" | "black" | "outlined";

export type LandingCarouselSlide = {
  id: string;
  title: string;
  heading?: string;
  headingImage?: string;
  headingSymbols?: SymbolHeadingVariant[];
  paragraphs: string[];
};

export const CONCEPT_CAROUSEL_SLIDES: LandingCarouselSlide[] = [
  {
    id: "concept",
    title: "Concept",
    heading: "Sensibility",
    paragraphs: [
      "우리는 수많은 데이터와 정보가 쏟아지는 시대 속에 살아간다.",
      "세상의 변화는 데이터와 정보가 아닌, 아직 포착되지 않은 미세한 가능성에서 시작된다.\n바다의 온도와 빛, 진동을 촉수로 감지하며 살아가는 해파리처럼\n우리는 사람과 사회, 기술의 변화 속에서 감각을 통해 보이지 않는 가능성을 발견한다.",
      "<sensibility>는 단순히 완성된 결과물을 나열하는 행위를 넘어,\n보이지 않는 흐름을 감지하고, 아직 오지 않은 미래를 디자인하는 과정을 보여준다.",
    ],
  },
  {
    id: "typography",
    title: "Typography",
    headingImage: "/icons/typo.svg",
    paragraphs: [
      "21대 졸업전시의 메인 단어인 ‘sensibility’의 감각의 연결을 형상화 한 타이포 제작",
    ],
  },
  {
    id: "symbol",
    title: "Symbol",
    headingSymbols: ["navy", "black", "outlined"],
    paragraphs: [
      "해파리의 촉수와 감각의 흐름을 나타내는 데이터를 형상화한 심볼",
    ],
  },
  {
    id: "senses",
    title: "Senses",
    heading: "Senses",
    paragraphs: [],
  },
];

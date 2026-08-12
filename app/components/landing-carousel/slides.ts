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
    heading: "'Sensibility'",
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
      "타이포그래피는 서로 분리된 정보가 아닌 감각을 통해 연결되는 하나의 흐름을 표현한다. \n글자를 관통하는 수평의 연결선은 사람과 사회, 기술을 잇는 보이지 않는 관계를 상징하며, 작은 감각들이 모여 새로운 가능성을 발견하는 과정을 담아낸다. \n부드럽고 유기적인 형태는 끊임없이 변화에 반응하는 감각성을 나타내며, 미세한 신호를 포착해 미래를 향해 나아가는 <sensibility>의 시선을 시각적으로 드러낸다.",
    ],
  },
  {
    id: "symbol",
    title: "Symbol",
    headingSymbols: ["navy", "black", "outlined"],
    paragraphs: [
      "심볼은 해파리 촉수에서 착안하여, 주변의 미세한 변화와 가능성을 감지하는 감각의 흐름을 데이터의 형태로 재해석 한 것이다. \n유기적으로 이어지는 선은 감각이 정보를 받아들이고 연결되는 과정을, \n독립적으로 배치된 점은 감지를 통해 발견되는 새로운 가능성과 시작의 순간을 의미한다. \n이는 <sensibility>가 바라보는 미래의 움직임과 가능성을 상징한다.",
    ],
  },
  {
    id: "senses",
    title: "Senses",
    heading: "Senses",
    paragraphs: [],
  },
];

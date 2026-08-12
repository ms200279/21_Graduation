export type CreditFragmentId = "01" | "02" | "03" | "04" | "05";
export type CreditGeometryId =
  | "left"
  | "upperLeft"
  | "upperCenter"
  | "right"
  | "bottom";
export type FragmentPoint = readonly [number, number];

export const PANEL = {
  left: -5,
  right: 5,
  top: 2.25,
  bottom: -2.25,
} as const;

export const CUT_POINTS = {
  A: [-4.05, 2.25] as const,
  B: [-0.55, 2.25] as const,
  C: [4.12, 2.25] as const,
  L: [-1.74, -0.95] as const,
  U: [-0.55, 0.36] as const,
  R: [2.21, -0.2] as const,
  D: [-2.26, -2.25] as const,
  RB: [2.98, -1.35] as const,
  E: [2.98, -2.25] as const,
} as const;

const { A, B, C, L, U, R, D, RB, E } = CUT_POINTS;

export const CREDIT_FRAGMENT_POLYGONS: Record<
  CreditGeometryId,
  readonly FragmentPoint[]
> = {
  left: [
    [PANEL.left, PANEL.top],
    A,
    L,
    D,
    [PANEL.left, PANEL.bottom],
  ],
  upperLeft: [A, B, U, L],
  upperCenter: [B, C, R, U],
  right: [
    C,
    [PANEL.right, PANEL.top],
    [PANEL.right, PANEL.bottom],
    E,
    RB,
    R,
  ],
  bottom: [L, U, R, RB, E, D],
} as const;

export const CREDIT_GEOMETRY_MAP: Record<
  CreditFragmentId,
  CreditGeometryId
> = {
  "01": "left",
  "02": "upperLeft",
  "03": "upperCenter",
  "04": "right",
  "05": "bottom",
};

export type CreditFragmentData = {
  id: CreditFragmentId;
  slug: string;
  title: string;
  description: string[];
  scale: number;
  selectedScale: number;
  rotation: [number, number, number];
  hue: string;
  seed: number;
};

export const creditFragments: CreditFragmentData[] = [
  {
    id: "01",
    slug: "committee",
    title: "Sensibility",
    description: [
      "안녕하세요, 제21회 디자인공학부 졸업전시위원회입니다.",
      "우리는 수많은 데이터와 정보가 쏟아지는 시대를 살아가고 있습니다. 하지만 세상의 변화는 언제나 명확한 결과나 수치로 먼저 드러나지 않습니다. 보이지 않는 흐름과 작은 신호 속에서 새로운 가능성은 시작됩니다.",
      "〈Sensibility〉는 이러한 가능성을 감각을 통해 발견하는 과정에 주목합니다. 해파리가 빛과 온도, 진동의 변화를 감지하며 유영하듯, 우리는 사람과 사회, 그리고 기술의 변화 속에서 아직 포착되지 않은 가능성을 발견합니다. 학생들은 각자의 감각과 시선을 바탕으로 세상을 관찰하고 해석하며, 그 과정에서 발견한 질문과 가능성을 디자인으로 풀어내고자 하였습니다.",
      "이번 전시는 단순히 완성된 결과물을 보여주는 자리가 아니라, 보이지 않는 변화를 감지하고 미래를 상상하며, 끊임없는 탐구와 실험을 통해 가능성을 구체화해 나간 과정의 기록입니다. 서로 다른 관점에서 출발한 생각들은 다양한 작품으로 표현되어 하나의 전시를 이룹니다.",
      "무엇보다 긴 시간 동안 자신만의 방식으로 가능성을 탐색해 온 학생들에게 깊은 감사와 박수를 보냅니다. 또한 학생들의 성장을 위해 아낌없는 가르침과 응원을 보내주신 교수님들께 진심으로 감사드립니다.",
      "이번 전시가 지금까지의 여정을 돌아보는 뜻깊은 순간이자, 다가올 변화와 미래를 상상하는 새로운 출발점이 되기를 바랍니다. 〈Sensibility〉를 통해 관람객 여러분도 잠시 머물며 보이지 않는 흐름을 감지하고, 각자의 감각으로 새로운 가능성을 발견하는 시간이 되기를 바랍니다.",
      "감사합니다.",
    ],
    scale: 1,
    selectedScale: 1.06,
    rotation: [0, 0, 0],
    hue: "#dcecff",
    seed: 1.15,
  },
  {
    id: "02",
    slug: "professor",
    title: "학부장님 한마디",
    description: [
      "제21회 한국공학대학교 디자인공학부 졸업작품전시회를 축하하며",
      "디자인공학부 산업디자인전공·미디어디자인전공 졸업작품전시회 개최를 축하드립니다.",
      "이번 졸업작품전시회는 학생 여러분이 대학 생활 동안 쌓아온 배움과 경험, 그리고 끊임없는 도전과 성장을 바탕으로 완성한 소중한 결실을 선보이는 뜻깊은 자리입니다. 수많은 고민과 연구, 창의적인 시도와 열정이 담긴 작품들은 졸업을 위한 결과물을 넘어 사회에 첫발을 내딛는 디자이너로서 비전과 가능성을 보여주는 값진 성과라 생각합니다.",
      "급변하는 시대 속에서 디자인은 사람과 기술, 문화와 사회를 연결하며 새로운 가치를 만들어내는 중요한 역할을 담당하고 있습니다. 우리 학생들이 이번 졸업작품전시를 통해 보여주는 창의적이고 혁신적인 시선은 우리 사회와 산업의 미래를 더욱 풍요롭게 만드는 원동력이 될 것입니다. 전시회를 준비하는 과정은 결코 쉽지 않았을 것입니다. 수많은 시행착오와 고민의 시간을 거쳐 자신만의 이야기를 작품으로 완성해낸 학생 여러분의 열정과 노고에 아낌없는 박수를 보냅니다.",
      "또한 학생들이 자신의 역량을 마음껏 펼칠 수 있도록 지도와 격려를 보내주신 교수님들, 그리고 든든한 응원을 보내주신 가족분들과 관계자 여러분께도 깊은 감사의 말씀을 전합니다. 이번 전시회가 그동안의 노력과 성취를 함께 나누는 소중한 축제의 장이 되기를 바라며, 학생 여러분이 앞으로도 창의성과 전문성을 바탕으로 디자인 분야를 이끌어가는 훌륭한 인재로 성장해 나가기를 기대합니다.",
      "제21회 한국공학대학교 디자인공학부 산업디자인전공·미디어디자인전공 졸업작품전시회의 성공적인 개최를 다시 한번 축하드리며, 참여한 모든 분들의 앞날에 새로운 도전과 빛나는 성취가 함께하기를 기원합니다.",
      "감사합니다.",
    ],
    scale: 1,
    selectedScale: 1.06,
    rotation: [0, 0, 0],
    hue: "#f1f7ff",
    seed: 2.4,
  },
  {
    id: "03",
    slug: "message",
    title: "졸업 전시 준비 위원회",
    description: [
      "Words and editorial structure connecting individual works into one flow.",
    ],
    scale: 1,
    selectedScale: 1.07,
    rotation: [0, 0, 0],
    hue: "#ffffff",
    seed: 3.05,
  },
  {
    id: "04",
    slug: "support",
    title: "웹사이트 제작후기",
    description: [
      "Operational help, technical support, and production assistance.",
    ],
    scale: 1,
    selectedScale: 1.06,
    rotation: [0, 0, 0],
    hue: "#edf4ff",
    seed: 4.2,
  },
  {
    id: "05",
    slug: "archive",
    title: "Archive",
    description: [
      "Web archive, interface implementation, and digital preservation.",
    ],
    scale: 1,
    selectedScale: 1.06,
    rotation: [0, 0, 0],
    hue: "#e7f0fb",
    seed: 5.55,
  },
];

export function getCreditFragmentBySlug(slug: string) {
  return creditFragments.find((fragment) => fragment.slug === slug) ?? null;
}

export function getCreditFragmentById(id: CreditFragmentId) {
  return creditFragments.find((fragment) => fragment.id === id) ?? null;
}

export function getCreditContentSide(id: CreditFragmentId): "left" | "right" {
  const polygon = CREDIT_FRAGMENT_POLYGONS[CREDIT_GEOMETRY_MAP[id]];
  const centroidX =
    polygon.reduce((total, point) => total + point[0], 0) / polygon.length;

  return centroidX <= 0 ? "right" : "left";
}

export const INITIAL_PARTICLE_TEXT = "Flexibility through Sensibility.";

const SENSE_DESCRIPTIONS = {
  촉각: {
    category: "Mobility & Robotics",
    description:
      "움직임과 접촉을 감지하며, 환경과 기술이 유연하게 연결되는 가능성을 발견합니다.",
  },
  시각: {
    category: "Social Problem & Public Design",
    description:
      "보이지 않던 사회의 변화를 바라보고, 새로운 시선으로 더 나은 가능성을 제안합니다.",
  },
  청각: {
    category: "Digital & Education Platform",
    description:
      "소통과 반응의 흐름에 귀 기울이며, 연결 속에서 새로운 가치를 만들어냅니다.",
  },
  미각: {
    category: "Smart Life & Home Appliances",
    description:
      "일상의 다양한 경험을 섬세하게 감각하며, 개인의 삶에 새로운 만족을 더합니다.",
  },
  후각: {
    category: "Healthcare & Wellness",
    description:
      "보이지 않는 몸과 마음의 신호를 감지하여, 건강한 변화와 회복의 가능성을 발견합니다.",
  },
} as const;

const EASTER_EGG_DESCRIPTIONS = {
  졸준위: "고생하셨습니다",
  감각: "오늘 기억에 남는 여러분의 감각은 어떤 감각인가요?",
  sensibility: "한국공학대학교 디자인 공학부 21대 졸업 전시",
  졸업: "모든 졸업생들의 안녕을 기원합니다",
  이새연: "위원장",
  송민철: "부위원장",
  박민수: "디자인팀장",
  김지윤: "디자인팀원",
  조희연: "디자인팀원",
  김세훈: "기획팀장",
  김지효: "기획팀원",
  채종은: "기획팀원",
  김은서: "총무팀장",
  신채희: "홍보팀장",
  조세빈: "홍보팀원",
  김민석: "웹사이트팀장",
} as const;

type SenseName = keyof typeof SENSE_DESCRIPTIONS;

export type ParticleDescription = {
  id: number;
  title: string;
  category?: string;
  description: string;
};

export function getParticleDescription(
  text: string,
): Omit<ParticleDescription, "id"> | null {
  if (Object.prototype.hasOwnProperty.call(SENSE_DESCRIPTIONS, text)) {
    const sense = text as SenseName;

    return {
      title: sense,
      category: SENSE_DESCRIPTIONS[sense].category,
      description: SENSE_DESCRIPTIONS[sense].description,
    };
  }

  const normalizedText = text.toLowerCase();

  if (
    !Object.prototype.hasOwnProperty.call(
      EASTER_EGG_DESCRIPTIONS,
      normalizedText,
    )
  ) {
    return null;
  }

  const easterEgg = normalizedText as keyof typeof EASTER_EGG_DESCRIPTIONS;

  return {
    title: easterEgg,
    description: EASTER_EGG_DESCRIPTIONS[easterEgg],
  };
}

const VERCEL_BLOB_BASE_URL =
  "https://egfgkebxcsl0qput.public.blob.vercel-storage.com";

// Project numbers 1–77 follow the source order in images.json.
// The JSON keys are numeric-looking student IDs, so Object.keys() would sort
// them numerically instead of preserving that project order.
const PROJECT_STUDENT_IDS = [
  "2023192001", "2023194001", "2022192002", "2022190002", "2023194002",
  "2023194003", "2023194004", "2022190006", "2021192004", "2021194006",
  "2021190004", "2022192004", "2020192009", "2021190010", "2023194008",
  "2021190011", "2022192006", "2023194010", "2023190040", "2022190011",
  "2020194011", "2023194012", "2019192014", "2021190019", "2023190009",
  "2022190014", "2021194015", "2019190014", "2023192013", "2021194016",
  "2023190012", "2020190041", "2022190020", "2023194017", "2023192015",
  "2022194020", "2021192018", "2023194020", "2023190017", "2023194021",
  "2022192020", "2020192022", "2021192019", "2023190021", "2021192021",
  "2023194023", "2021194018", "2023190041", "2022190037", "2023192019",
  "2022194028", "2021194021", "2023190022", "2020192030", "2021194025",
  "2021192026", "2021194040", "2023190026", "2023192038", "2019190031",
  "2022190034", "2023190030", "2023194040", "2023194032", "2021192030",
  "2023192031", "2022192032", "2023192032", "2022194035", "2023194042",
  "2020162039", "2023190034", "2021192033", "2022194037", "2020190037",
  "2021194035", "2021190037",
] as const;

export type ProjectImageSet = {
  thumbnail: string;
  background: string;
  goal: string;
  featureMain: string;
  feature2: string;
  feature3: string;
  detail1: string;
  detail2: string;
  detail3: string;
};

export function getProjectImages(projectNo: number): ProjectImageSet {
  const studentId = PROJECT_STUDENT_IDS[projectNo - 1];

  if (!studentId) {
    throw new RangeError(`Project ${projectNo} has no image set`);
  }

  const imageUrl = (fileName: string) =>
    `${VERCEL_BLOB_BASE_URL}/works/${studentId}/${fileName}.webp`;

  return {
    thumbnail: imageUrl("thumbnail"),
    background: imageUrl("background"),
    goal: imageUrl("goal"),
    featureMain: imageUrl("feature-main"),
    feature2: imageUrl("feature-2"),
    feature3: imageUrl("feature-3"),
    detail1: imageUrl("detail-1"),
    detail2: imageUrl("detail-2"),
    detail3: imageUrl("detail-3"),
  };
}

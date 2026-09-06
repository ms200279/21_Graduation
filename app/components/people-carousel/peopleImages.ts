import peopleImages from "@/app/data/people-images.json";

export type PeopleImageRecord = {
  studentId: string;
  name: string;
  image: string | null;
};

function assertObject(
  value: unknown,
  context: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${context} must be an object`);
  }
}

function assertPeopleImageRecord(
  value: unknown,
  index: number,
): asserts value is PeopleImageRecord {
  assertObject(value, `People image at index ${index}`);

  if (typeof value.studentId !== "string" || value.studentId.length === 0) {
    throw new TypeError(
      `People image at index ${index}.studentId must be a string`,
    );
  }

  if (typeof value.name !== "string" || value.name.length === 0) {
    throw new TypeError(`People image at index ${index}.name must be a string`);
  }

  if (value.image !== null && typeof value.image !== "string") {
    throw new TypeError(
      `People image at index ${index}.image must be a string or null`,
    );
  }
}

export function parsePeopleImages(value: unknown): PeopleImageRecord[] {
  if (!Array.isArray(value)) {
    throw new TypeError("People images must be an array");
  }

  value.forEach(assertPeopleImageRecord);

  return value;
}

const PEOPLE_IMAGE_RECORDS = parsePeopleImages(peopleImages);

function toPhotoSrc(image: string | null) {
  return image ? encodeURI(image) : undefined;
}

export function getPeoplePhotoSrc(name: string, studentId: string) {
  const nameMatches = PEOPLE_IMAGE_RECORDS.filter(
    (record) => record.name === name,
  );

  if (nameMatches.length === 1) {
    return toPhotoSrc(nameMatches[0].image);
  }

  const studentMatch = nameMatches.find(
    (record) => record.studentId === studentId,
  );

  return toPhotoSrc(studentMatch?.image ?? null);
}

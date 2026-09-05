import { isPeopleMajorTag, type PeopleMajorTag } from "./peopleCategories";

export type SourcePerson = {
  studentId: string;
  name: string;
  phone?: string;
  majorTag: PeopleMajorTag;
};

function assertObject(
  value: unknown,
  context: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${context} must be an object`);
  }
}

function assertSourcePerson(
  value: unknown,
  index: number,
): asserts value is SourcePerson {
  assertObject(value, `Person at index ${index}`);

  if (typeof value.studentId !== "string" || value.studentId.length === 0) {
    throw new TypeError(`Person at index ${index}.studentId must be a string`);
  }

  if (typeof value.name !== "string" || value.name.length === 0) {
    throw new TypeError(`Person at index ${index}.name must be a string`);
  }

  if (value.phone !== undefined && typeof value.phone !== "string") {
    throw new TypeError(
      `Person at index ${index}.phone must be a string when provided`,
    );
  }

  if (typeof value.majorTag !== "number" || !isPeopleMajorTag(value.majorTag)) {
    throw new TypeError(`Person at index ${index}.majorTag must be 1 or 2`);
  }
}

export function parsePeopleRoster(value: unknown): SourcePerson[] {
  if (!Array.isArray(value)) {
    throw new TypeError("People data must be an array");
  }

  value.forEach(assertSourcePerson);

  return value;
}

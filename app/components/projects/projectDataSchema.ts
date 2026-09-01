import {
  isProjectSourceTag,
  type ProjectSourceTag,
} from "./projectCategories";

export type SourceCopyBlock = {
  subtitle?: string;
  body?: string;
};

export type SourceProject = {
  projectNo: number;
  tag: ProjectSourceTag;
  title: {
    ko?: string;
    en?: string;
  };
  oneLine?: string;
  background?: SourceCopyBlock;
  goal?: SourceCopyBlock;
  features?: SourceCopyBlock[];
  detail?: Array<{ body?: string }>;
};

function describeProject(value: Record<string, unknown>, index: number) {
  const projectNo = value.projectNo;

  return typeof projectNo === "number"
    ? `Project ${projectNo}`
    : `Project at index ${index}`;
}

function assertOptionalString(
  value: Record<string, unknown>,
  field: string,
  context: string,
) {
  if (value[field] !== undefined && typeof value[field] !== "string") {
    throw new TypeError(`${context}.${field} must be a string when provided`);
  }
}

function assertObject(
  value: unknown,
  context: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${context} must be an object`);
  }
}

function assertCopyBlock(value: unknown, context: string) {
  assertObject(value, context);
  assertOptionalString(value, "subtitle", context);
  assertOptionalString(value, "body", context);
}

function assertOptionalCopyBlock(
  project: Record<string, unknown>,
  field: "background" | "goal",
  context: string,
) {
  const value = project[field];

  if (value !== undefined) {
    assertCopyBlock(value, `${context}.${field}`);
  }
}

function assertSourceProject(
  value: unknown,
  index: number,
): asserts value is SourceProject {
  assertObject(value, `Project at index ${index}`);
  const context = describeProject(value, index);

  if (
    typeof value.projectNo !== "number" ||
    !Number.isInteger(value.projectNo)
  ) {
    throw new TypeError(`${context}.projectNo must be an integer`);
  }

  if (typeof value.tag !== "number" || !Number.isInteger(value.tag)) {
    throw new TypeError(`${context}.tag must be an integer`);
  }

  if (!isProjectSourceTag(value.tag)) {
    throw new Error(`${context} has unknown source tag: ${value.tag}`);
  }

  assertObject(value.title, `${context}.title`);
  assertOptionalString(value.title, "ko", `${context}.title`);
  assertOptionalString(value.title, "en", `${context}.title`);
  assertOptionalString(value, "oneLine", context);
  assertOptionalCopyBlock(value, "background", context);
  assertOptionalCopyBlock(value, "goal", context);

  if (value.features !== undefined) {
    if (!Array.isArray(value.features)) {
      throw new TypeError(`${context}.features must be an array when provided`);
    }

    value.features.forEach((feature, featureIndex) => {
      assertCopyBlock(feature, `${context}.features[${featureIndex}]`);
    });
  }

  if (value.detail !== undefined) {
    if (!Array.isArray(value.detail)) {
      throw new TypeError(`${context}.detail must be an array when provided`);
    }

    value.detail.forEach((detail, detailIndex) => {
      assertObject(detail, `${context}.detail[${detailIndex}]`);
      assertOptionalString(
        detail,
        "body",
        `${context}.detail[${detailIndex}]`,
      );
    });
  }
}

export function parseProjectInfo(value: unknown): SourceProject[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Project data must be an array");
  }

  value.forEach(assertSourceProject);

  return value;
}

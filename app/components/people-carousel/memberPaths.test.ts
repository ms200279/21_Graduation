import { describe, expect, it } from "vitest";

import {
  findMemberIndexBySlug,
  getMemberPathFromIndex,
  getMemberSlugFromIndex,
  parseMemberSlugFromPath,
} from "./memberPaths";

describe("memberPaths", () => {
  it("formats member indexes as stable two-digit paths", () => {
    expect(getMemberSlugFromIndex(0)).toBe("01");
    expect(getMemberPathFromIndex(11)).toBe("/peoplepage/12");
  });

  it("parses only direct people detail paths", () => {
    expect(parseMemberSlugFromPath("/peoplepage/09")).toBe("09");
    expect(parseMemberSlugFromPath("/peoplepage/09/")).toBe("09");
    expect(parseMemberSlugFromPath("/peoplepage")).toBeNull();
    expect(parseMemberSlugFromPath("/peoplepage/09/more")).toBeNull();
  });

  it("resolves valid slugs and rejects out-of-range values", () => {
    expect(findMemberIndexBySlug(99, "1")).toBe(0);
    expect(findMemberIndexBySlug(99, "09")).toBe(8);
    expect(findMemberIndexBySlug(99, "100")).toBe(-1);
    expect(findMemberIndexBySlug(99, "member")).toBe(-1);
  });
});

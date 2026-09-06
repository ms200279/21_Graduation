import { describe, expect, it } from "vitest";

import peopleImages from "@/app/data/people-images.json";

import { getPeoplePhotoSrc, parsePeopleImages } from "./peopleImages";

describe("parsePeopleImages", () => {
  it("accepts the exhibition people image map", () => {
    const records = parsePeopleImages(peopleImages);

    expect(records).toHaveLength(98);
    expect(records.filter((record) => record.image)).toHaveLength(96);
    expect(records.find((record) => record.name === "공건호")).toMatchObject({
      studentId: "2023192001",
      image: "/people/2023192001_공건호.png",
    });
  });

  it("rejects a record without a name", () => {
    expect(() =>
      parsePeopleImages([
        {
          studentId: "2023192001",
          image: "/people/2023192001_공건호.png",
        },
      ]),
    ).toThrow(/name/);
  });
});

describe("getPeoplePhotoSrc", () => {
  it("matches a unique name to its portrait path", () => {
    expect(getPeoplePhotoSrc("공건호", "2023192001")).toBe(
      encodeURI("/people/2023192001_공건호.png"),
    );
  });

  it("uses studentId when the same name appears more than once", () => {
    expect(getPeoplePhotoSrc("김은서", "2023192037")).toBe(
      encodeURI("/people/2023192037_김은서.png"),
    );
    expect(getPeoplePhotoSrc("김은서", "2023192005")).toBe(
      encodeURI("/people/2023192005_김은서.png"),
    );
  });

  it("leaves people without a source image empty", () => {
    expect(getPeoplePhotoSrc("문기돈", "2021190017")).toBeUndefined();
    expect(getPeoplePhotoSrc("정해인", "2022190034")).toBeUndefined();
  });
});

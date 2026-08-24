import {
  formatReleaseDate,
  isValidReleaseDate,
  getReleaseDatePrecision,
  getReleaseDateInputValue,
} from "@/lib/date";
import { describe, expect, it } from "vitest";

describe("release date helpers", () => {
  it("accepts year, month and exact date precision", () => {
    expect(getReleaseDatePrecision("2027")).toBe("year");
    expect(getReleaseDatePrecision("2027-11")).toBe("month");
    expect(getReleaseDatePrecision("2027-11-18")).toBe("day");
  });

  it("keeps partial year input visible while typing", () => {
    expect(getReleaseDateInputValue("", "year")).toBe("");
    expect(getReleaseDateInputValue("2", "year")).toBe("2");
    expect(getReleaseDateInputValue("20", "year")).toBe("20");
    expect(getReleaseDateInputValue("202", "year")).toBe("202");
    expect(getReleaseDateInputValue("2027", "year")).toBe("2027");
    expect(getReleaseDateInputValue("2027-11", "year")).toBe("");
  });

  it("rejects malformed or impossible release dates", () => {
    expect(isValidReleaseDate("2027")).toBe(true);
    expect(isValidReleaseDate("2027-11")).toBe(true);
    expect(isValidReleaseDate("2027-11-18")).toBe(true);
    expect(isValidReleaseDate("2027-13")).toBe(false);
    expect(isValidReleaseDate("2027-02-30")).toBe(false);
    expect(isValidReleaseDate("27")).toBe(false);
  });

  it("formats partial dates without inventing missing parts", () => {
    expect(formatReleaseDate("2027", "fr")).toBe("2027");
    expect(formatReleaseDate("2027-11", "fr")).toContain("2027");
    expect(formatReleaseDate("2027-11-18", "fr")).toContain("18");
  });
});

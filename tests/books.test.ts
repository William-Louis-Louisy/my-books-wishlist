import { describe, expect, it } from "vitest";
import {
  buildBookTimeline,
  deriveStatus,
  filterBooks,
  getBookAutocompleteOptions,
  getBookDisplayTitle,
  groupBooks,
  groupBooksByReleasePeriod,
  groupBooksByTimelinePeriod,
  hasValidBookIdentity,
  mergeBooksIgnoringDuplicateIds,
  resolveBookStatus,
} from "@/lib/books";
import type { Book } from "@/types/book";

const baseBook: Book = {
  id: "1",
  title: "Le livre",
  author: "Une autrice",
  series: "Les Archives de Brume",
  volume: "2",
  publisher: "Maison",
  releaseDate: "2027-03-12",
  purchased: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("book business rules", () => {
  it("derives status from an exact local release date", () => {
    expect(deriveStatus("2026-08-22", "2026-08-22")).toBe("available");
    expect(deriveStatus("2026-08-23", "2026-08-22")).toBe("upcoming");
  });

  it("derives partial-date status without inventing missing precision", () => {
    expect(deriveStatus("2025", "2026-08-22")).toBe("available");
    expect(deriveStatus("2027", "2026-08-22")).toBe("upcoming");
    expect(deriveStatus("2026", "2026-08-22")).toBe("unknown");

    expect(deriveStatus("2026-07", "2026-08-22")).toBe("available");
    expect(deriveStatus("2026-09", "2026-08-22")).toBe("upcoming");
    expect(deriveStatus("2026-08", "2026-08-22")).toBe("unknown");
  });

  it("accepts a title or a complete series and volume identity", () => {
    expect(hasValidBookIdentity(baseBook)).toBe(true);
    expect(hasValidBookIdentity({ ...baseBook, title: undefined })).toBe(true);
    expect(
      hasValidBookIdentity({ ...baseBook, title: undefined, volume: undefined }),
    ).toBe(false);
    expect(
      hasValidBookIdentity({ ...baseBook, title: undefined, series: undefined }),
    ).toBe(false);
  });

  it("uses the explicit title or falls back to series and volume", () => {
    expect(getBookDisplayTitle(baseBook, (volume) => `Tome ${volume}`)).toBe("Le livre");
    expect(
      getBookDisplayTitle(
        { ...baseBook, title: undefined },
        (volume) => `Tome ${volume}`,
      ),
    ).toBe("Les Archives de Brume · Tome 2");
  });

  it("resolves status entirely from releaseDate", () => {
    expect(resolveBookStatus({ ...baseBook, releaseDate: "2025" }, "2026-08-22")).toBe(
      "available",
    );
    expect(resolveBookStatus({ ...baseBook, releaseDate: "2027" }, "2026-08-22")).toBe(
      "upcoming",
    );
  });

  it("keeps purchased books in their derived release-status group", () => {
    const books: Book[] = [
      { ...baseBook, id: "a", releaseDate: "2027-05-01" },
      { ...baseBook, id: "b", releaseDate: "2026-01-01" },
      {
        ...baseBook,
        id: "c",
        releaseDate: "2027-01-01",
        purchased: true,
        purchasedAt: "2026-08-22T10:00:00.000Z",
      },
      {
        ...baseBook,
        id: "d",
        releaseDate: "2026-02-01",
        purchased: true,
        purchasedAt: "2026-08-22T10:00:00.000Z",
      },
      { ...baseBook, id: "e", releaseDate: "2026-08" },
    ];
    const groups = groupBooks(books, "2026-08-22");
    expect(groups.upcoming.map((book) => book.id)).toEqual(["c", "a"]);
    expect(groups.available.map((book) => book.id)).toEqual(["b", "d"]);
    expect(groups.unknown.map((book) => book.id)).toEqual(["e"]);
  });

  it("groups releases by known month and keeps year-only releases explicit", () => {
    const books: Book[] = [
      { ...baseBook, id: "a", title: "A", releaseDate: "2027-10-20" },
      { ...baseBook, id: "b", title: "B", releaseDate: "2027-09" },
      { ...baseBook, id: "c", title: "C", releaseDate: "2027-10-02" },
      { ...baseBook, id: "d", title: "D", releaseDate: "2027" },
    ];

    const ascending = groupBooksByReleasePeriod(books, "asc");
    expect(ascending.map((group) => group.key)).toEqual([
      "2027-09",
      "2027-10",
      "2027",
    ]);
    expect(ascending[1].books.map((book) => book.id)).toEqual(["c", "a"]);

    const descending = groupBooksByReleasePeriod(books, "desc");
    expect(descending.map((group) => group.key)).toEqual([
      "2027-10",
      "2027-09",
      "2027",
    ]);
    expect(descending[0].books.map((book) => book.id)).toEqual(["a", "c"]);
  });

  it("builds a timeline around the current month with coarse year groups", () => {
    const books: Book[] = [
      { ...baseBook, id: "future-year", releaseDate: "2027" },
      { ...baseBook, id: "past-year", releaseDate: "2025" },
      { ...baseBook, id: "current-year", releaseDate: "2026" },
      { ...baseBook, id: "current-month", releaseDate: "2026-08" },
      { ...baseBook, id: "current-upcoming", releaseDate: "2026-08-30" },
      { ...baseBook, id: "current-available", releaseDate: "2026-08-02" },
      { ...baseBook, id: "future-next", releaseDate: "2026-09" },
      { ...baseBook, id: "past-recent", releaseDate: "2026-07-24" },
    ];

    const groups = groupBooksByTimelinePeriod(books, "2026-08-22");

    expect(groups.map((group) => group.key)).toEqual([
      "2026-08",
      "2026",
      "2026-09",
      "2027",
      "2026-07",
      "2025",
    ]);
    expect(groups[0].books.map((book) => book.id)).toEqual([
      "current-available",
      "current-upcoming",
      "current-month",
    ]);
  });

  it("keeps the current year and future visible while archiving older years", () => {
    const books: Book[] = [
      { ...baseBook, id: "current", releaseDate: "2026-08-20" },
      { ...baseBook, id: "current-past", releaseDate: "2026-04" },
      { ...baseBook, id: "future", releaseDate: "2027" },
      { ...baseBook, id: "2025-dec", releaseDate: "2025-12-10" },
      { ...baseBook, id: "2025-jan", releaseDate: "2025-01" },
      { ...baseBook, id: "2025-year", releaseDate: "2025" },
      { ...baseBook, id: "2024", releaseDate: "2024-06-01" },
    ];

    const timeline = buildBookTimeline(books, "2026-08-22");

    expect(timeline.currentYear).toBe("2026");
    expect(timeline.activeGroups.map((group) => group.key)).toEqual([
      "2026-08",
      "2027",
      "2026-04",
    ]);
    expect(timeline.archives.map((archive) => archive.year)).toEqual([
      "2025",
      "2024",
    ]);
    expect(timeline.archives[0].bookCount).toBe(3);
    expect(timeline.archives[0].groups.map((group) => group.key)).toEqual([
      "2025-12",
      "2025-01",
      "2025",
    ]);
  });

  it("builds trimmed case-insensitive autocomplete options", () => {
    const books: Book[] = [
      baseBook,
      {
        ...baseBook,
        id: "2",
        author: " une autrice ",
        series: "Autre série",
        publisher: "Deuxième",
      },
      {
        ...baseBook,
        id: "3",
        author: "Un auteur",
        series: undefined,
        publisher: "maison",
      },
      { ...baseBook, id: "4", author: undefined, publisher: undefined },
    ];

    expect(getBookAutocompleteOptions(books, "author", "fr")).toEqual([
      "Un auteur",
      "Une autrice",
    ]);
    expect(getBookAutocompleteOptions(books, "series", "fr")).toEqual([
      "Autre série",
      "Les Archives de Brume",
    ]);
    expect(getBookAutocompleteOptions(books, "publisher", "fr")).toEqual([
      "Deuxième",
      "Maison",
    ]);
  });

  it("filters by publisher, title, author, series or volume", () => {
    const books = [
      baseBook,
      {
        ...baseBook,
        id: "2",
        title: "Autre",
        author: "Quelqu'un",
        series: undefined,
        volume: undefined,
        publisher: "Deuxième",
      },
      {
        ...baseBook,
        id: "3",
        title: "Sans éditeur",
        author: undefined,
        publisher: undefined,
      },
    ];
    expect(filterBooks(books, "autrice", "Maison")).toHaveLength(1);
    expect(filterBooks(books, "autre", "")).toHaveLength(1);
    expect(filterBooks(books, "brume", "")).toHaveLength(2);
    expect(filterBooks(books, "2", "Maison")).toHaveLength(1);
    expect(filterBooks(books, "sans éditeur", "")).toHaveLength(1);
  });

  it("merges Drive imports without replacing duplicate local ids", () => {
    const incoming = [
      { ...baseBook, title: "Version Drive" },
      { ...baseBook, id: "2", title: "Nouveau" },
    ];
    const merged = mergeBooksIgnoringDuplicateIds([baseBook], incoming);
    expect(merged).toHaveLength(2);
    expect(merged[0].title).toBe("Le livre");
  });
});

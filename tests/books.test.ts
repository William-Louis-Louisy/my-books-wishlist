import { describe, expect, it } from "vitest";
import { deriveStatus, filterBooks, groupBooks, mergeBooksIgnoringDuplicateIds, resolveBookStatus } from "@/lib/books";
import type { Book } from "@/types/book";

const baseBook: Book = {
  id: "1",
  title: "Le livre",
  author: "Une autrice",
  publisher: "Maison",
  releaseDate: "2027-03-12",
  status: "upcoming",
  statusOverride: null,
  purchased: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("book business rules", () => {
  it("derives availability from the local ISO date", () => {
    expect(deriveStatus("2026-08-22", "2026-08-22")).toBe("available");
    expect(deriveStatus("2026-08-23", "2026-08-22")).toBe("upcoming");
  });

  it("keeps an explicit status override", () => {
    expect(resolveBookStatus({ ...baseBook, releaseDate: "2026-01-01", statusOverride: "upcoming" }, "2026-08-22")).toBe("upcoming");
  });

  it("groups purchased books independently from release status and sorts by date", () => {
    const books: Book[] = [
      { ...baseBook, id: "a", releaseDate: "2027-05-01" },
      { ...baseBook, id: "b", releaseDate: "2026-01-01", status: "available" },
      { ...baseBook, id: "c", releaseDate: "2027-01-01", purchased: true, purchasedAt: "2026-08-22T10:00:00.000Z" },
    ];
    const groups = groupBooks(books, "2026-08-22");
    expect(groups.upcoming.map((book) => book.id)).toEqual(["a"]);
    expect(groups.available.map((book) => book.id)).toEqual(["b"]);
    expect(groups.purchased.map((book) => book.id)).toEqual(["c"]);
  });

  it("filters by publisher and title or author", () => {
    const books = [baseBook, { ...baseBook, id: "2", title: "Autre", author: "Quelqu'un", publisher: "Deuxième" }];
    expect(filterBooks(books, "autrice", "Maison")).toHaveLength(1);
    expect(filterBooks(books, "autre", "")).toHaveLength(1);
  });

  it("merges Drive imports without replacing duplicate local ids", () => {
    const incoming = [{ ...baseBook, title: "Version Drive" }, { ...baseBook, id: "2", title: "Nouveau" }];
    const merged = mergeBooksIgnoringDuplicateIds([baseBook], incoming);
    expect(merged).toHaveLength(2);
    expect(merged[0].title).toBe("Le livre");
  });
});

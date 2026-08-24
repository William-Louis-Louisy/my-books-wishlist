import {
  parseBookBackup,
  BOOK_BACKUP_VERSION,
  parseBookBackupJson,
  serializeBookBackup,
} from "@/lib/book-backup";
import type { Book } from "@/types/book";
import { describe, expect, it } from "vitest";

const baseBook: Book = {
  id: "book-1",
  title: "Le livre",
  author: "Une autrice",
  series: "Les Archives de Brume",
  volume: "2",
  publisher: "Maison",
  releaseDate: "2027-11",
  purchased: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-08-22T12:00:00.000Z",
};

describe("book backup pipeline", () => {
  it("serializes the current format as a versioned V2 envelope", () => {
    const serialized = serializeBookBackup([baseBook]);
    const payload = JSON.parse(serialized) as {
      version: number;
      exportedAt: string;
      books: Book[];
    };

    expect(payload.version).toBe(BOOK_BACKUP_VERSION);
    expect(Number.isNaN(Date.parse(payload.exportedAt))).toBe(false);
    expect(payload.books).toEqual([baseBook]);
  });

  it("parses the current V2 envelope", () => {
    expect(
      parseBookBackup({
        version: 2,
        exportedAt: "2026-08-22T12:00:00.000Z",
        books: [baseBook],
      }),
    ).toEqual([baseBook]);
  });

  it("migrates legacy V1 records and ignores persisted status fields", () => {
    const legacy = {
      ...baseBook,
      releaseDate: "2026-08-22",
      status: "available",
      statusOverride: "upcoming",
    };

    const [book] = parseBookBackup({
      exportedAt: "2026-08-22T12:00:00.000Z",
      books: [legacy],
    });

    expect(book.releaseDate).toBe("2026-08-22");
    expect(book).not.toHaveProperty("status");
    expect(book).not.toHaveProperty("statusOverride");
  });

  it("accepts the historical raw-array backup shape", () => {
    expect(parseBookBackup([baseBook])).toEqual([baseBook]);
  });

  it("accepts optional V2 fields and partial release dates", () => {
    const minimal = {
      id: "book-2",
      series: "Une saga",
      volume: "HS",
      releaseDate: "2028",
      purchased: true,
      purchasedAt: "2026-08-22T12:00:00.000Z",
      createdAt: "2026-08-22T12:00:00.000Z",
      updatedAt: "2026-08-22T12:00:00.000Z",
    };

    expect(parseBookBackup({ version: 2, books: [minimal] })).toEqual([
      minimal,
    ]);
  });

  it("rejects malformed JSON and invalid book entries", () => {
    expect(() => parseBookBackupJson("{not-json")).toThrow();
    expect(() =>
      parseBookBackup({
        books: [{ ...baseBook, releaseDate: "2027-13" }],
      }),
    ).toThrow();
    expect(() =>
      parseBookBackup({
        books: [
          {
            ...baseBook,
            title: undefined,
            series: undefined,
            volume: undefined,
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects duplicate ids before any import is applied", () => {
    expect(() =>
      parseBookBackup({
        books: [baseBook, { ...baseBook }],
      }),
    ).toThrow(/plusieurs fois/);
  });

  it("rejects backup versions newer than the app understands", () => {
    expect(() => parseBookBackup({ version: 99, books: [baseBook] })).toThrow(
      /version/,
    );
  });
});

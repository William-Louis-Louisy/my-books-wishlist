import type { Book, BookStatus } from "@/types/book";
import { getTodayIso } from "@/lib/date";

export interface BookGroups {
  upcoming: Book[];
  available: Book[];
  purchased: Book[];
}

export function deriveStatus(releaseDate: string, today = getTodayIso()): BookStatus {
  return releaseDate <= today ? "available" : "upcoming";
}

export function resolveBookStatus(book: Book, today = getTodayIso()): BookStatus {
  return book.statusOverride ?? deriveStatus(book.releaseDate, today);
}

export function groupBooks(books: Book[], today = getTodayIso()): BookGroups {
  const byReleaseDate = (a: Book, b: Book) =>
    a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title, "fr");

  const groups: BookGroups = { upcoming: [], available: [], purchased: [] };

  for (const book of books) {
    if (book.purchased) {
      groups.purchased.push(book);
      continue;
    }

    groups[resolveBookStatus(book, today)].push(book);
  }

  groups.upcoming.sort(byReleaseDate);
  groups.available.sort(byReleaseDate);
  groups.purchased.sort(byReleaseDate);
  return groups;
}

export function filterBooks(books: Book[], query: string, publisher: string): Book[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
  return books.filter((book) => {
    const matchesPublisher = !publisher || book.publisher === publisher;
    const searchableValues = [book.title, book.author, book.series, book.volume]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLocaleLowerCase("fr-FR"));
    const matchesQuery =
      !normalizedQuery || searchableValues.some((value) => value.includes(normalizedQuery));
    return matchesPublisher && matchesQuery;
  });
}

export function mergeBooksIgnoringDuplicateIds(local: Book[], incoming: Book[]): Book[] {
  const ids = new Set(local.map((book) => book.id));
  return [...local, ...incoming.filter((book) => !ids.has(book.id))];
}

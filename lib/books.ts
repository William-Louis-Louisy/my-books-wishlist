import type { Book, BookStatus } from "@/types/book";
import { getTodayIso } from "@/lib/date";

export interface BookGroups {
  upcoming: Book[];
  available: Book[];
}

export interface BookMonthGroup {
  month: string;
  books: Book[];
}

export type BookOrganizationMode = "month" | "status";
export type BookAutocompleteField = "author" | "series" | "publisher";

type BookDisplayIdentity = Pick<Book, "title" | "series" | "volume">;

export function getBookDisplayTitle(
  book: BookDisplayIdentity,
  formatVolume: (volume: string) => string = (volume) => volume,
): string {
  const title = book.title.trim();
  if (title) return title;

  const series = book.series?.trim();
  const volume = book.volume?.trim();
  if (series && volume) return `${series} · ${formatVolume(volume)}`;

  return series || volume || "";
}

export function deriveStatus(releaseDate: string, today = getTodayIso()): BookStatus {
  return releaseDate <= today ? "available" : "upcoming";
}

export function resolveBookStatus(book: Book, today = getTodayIso()): BookStatus {
  return book.statusOverride ?? deriveStatus(book.releaseDate, today);
}

export function groupBooks(books: Book[], today = getTodayIso()): BookGroups {
  const byReleaseDate = (a: Book, b: Book) =>
    a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title);

  const groups: BookGroups = { upcoming: [], available: [] };

  for (const book of books) {
    groups[resolveBookStatus(book, today)].push(book);
  }

  groups.upcoming.sort(byReleaseDate);
  groups.available.sort(byReleaseDate);
  return groups;
}

export function groupBooksByReleaseMonth(
  books: Book[],
  order: "asc" | "desc" = "asc",
): BookMonthGroup[] {
  const grouped = new Map<string, Book[]>();

  for (const book of books) {
    const month = book.releaseDate.slice(0, 7);
    const existing = grouped.get(month);
    if (existing) existing.push(book);
    else grouped.set(month, [book]);
  }

  const direction = order === "asc" ? 1 : -1;
  return [...grouped.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB) * direction)
    .map(([month, monthBooks]) => ({
      month,
      books: [...monthBooks].sort((a, b) => {
        const byDate = a.releaseDate.localeCompare(b.releaseDate) * direction;
        return byDate || a.title.localeCompare(b.title);
      }),
    }));
}

export function groupBooksByTimelineMonth(
  books: Book[],
  today = getTodayIso(),
): BookMonthGroup[] {
  const currentMonth = today.slice(0, 7);
  const grouped = new Map<string, Book[]>();

  for (const book of books) {
    const month = book.releaseDate.slice(0, 7);
    const existing = grouped.get(month);
    if (existing) existing.push(book);
    else grouped.set(month, [book]);
  }

  return [...grouped.entries()]
    .sort(([monthA], [monthB]) => {
      const aIsCurrentOrFuture = monthA >= currentMonth;
      const bIsCurrentOrFuture = monthB >= currentMonth;

      if (aIsCurrentOrFuture !== bIsCurrentOrFuture) {
        return aIsCurrentOrFuture ? -1 : 1;
      }

      return aIsCurrentOrFuture
        ? monthA.localeCompare(monthB)
        : monthB.localeCompare(monthA);
    })
    .map(([month, monthBooks]) => {
      const direction = month >= currentMonth ? 1 : -1;
      return {
        month,
        books: [...monthBooks].sort((a, b) => {
          const byDate = a.releaseDate.localeCompare(b.releaseDate) * direction;
          return byDate || a.title.localeCompare(b.title);
        }),
      };
    });
}

export function getBookAutocompleteOptions(
  books: Book[],
  field: BookAutocompleteField,
  locale: string,
): string[] {
  const unique = new Map<string, string>();

  for (const book of books) {
    const rawValue = book[field];
    if (!rawValue) continue;
    const value = rawValue.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase(locale);
    if (!unique.has(key)) unique.set(key, value);
  }

  return [...unique.values()].sort((a, b) => a.localeCompare(b, locale));
}

export function filterBooks(books: Book[], query: string, publisher: string): Book[] {
  const normalizedQuery = query.trim().toLowerCase();
  return books.filter((book) => {
    const matchesPublisher = !publisher || book.publisher === publisher;
    const searchableValues = [book.title, book.author, book.series, book.volume]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    const matchesQuery =
      !normalizedQuery || searchableValues.some((value) => value.includes(normalizedQuery));
    return matchesPublisher && matchesQuery;
  });
}

export function mergeBooksIgnoringDuplicateIds(local: Book[], incoming: Book[]): Book[] {
  const ids = new Set(local.map((book) => book.id));
  return [...local, ...incoming.filter((book) => !ids.has(book.id))];
}

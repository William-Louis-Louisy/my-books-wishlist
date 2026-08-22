import type { Book, BookStatus } from "@/types/book";
import { getReleaseDatePrecision, getTodayIso } from "@/lib/date";

export interface BookGroups {
  upcoming: Book[];
  available: Book[];
  unknown: Book[];
}

export interface BookReleaseGroup {
  key: string;
  year: string;
  month?: string;
  books: Book[];
}

export interface BookYearArchive {
  year: string;
  groups: BookReleaseGroup[];
  bookCount: number;
}

export interface BookTimeline {
  currentYear: string;
  activeGroups: BookReleaseGroup[];
  archives: BookYearArchive[];
}

export type BookOrganizationMode = "month" | "status";
export type BookAutocompleteField = "author" | "series" | "publisher";

type BookDisplayIdentity = Pick<Book, "title" | "series" | "volume">;

export function hasValidBookIdentity(book: BookDisplayIdentity): boolean {
  const hasTitle = Boolean(book.title?.trim());
  const hasSeriesAndVolume = Boolean(book.series?.trim() && book.volume?.trim());
  return hasTitle || hasSeriesAndVolume;
}

export function getBookDisplayTitle(
  book: BookDisplayIdentity,
  formatVolume: (volume: string) => string = (volume) => volume,
): string {
  const title = book.title?.trim();
  if (title) return title;

  const series = book.series?.trim();
  const volume = book.volume?.trim();
  if (series && volume) return `${series} · ${formatVolume(volume)}`;

  return series || volume || "";
}

export function deriveStatus(
  releaseDate: string,
  today = getTodayIso(),
): BookStatus {
  const precision = getReleaseDatePrecision(releaseDate);
  if (!precision) return "unknown";

  if (precision === "day") {
    return releaseDate <= today ? "available" : "upcoming";
  }

  if (precision === "month") {
    const currentMonth = today.slice(0, 7);
    if (releaseDate < currentMonth) return "available";
    if (releaseDate > currentMonth) return "upcoming";
    return "unknown";
  }

  const currentYear = today.slice(0, 4);
  if (releaseDate < currentYear) return "available";
  if (releaseDate > currentYear) return "upcoming";
  return "unknown";
}

export function resolveBookStatus(book: Book, today = getTodayIso()): BookStatus {
  return deriveStatus(book.releaseDate, today);
}

function getBookSortTitle(book: Book): string {
  return getBookDisplayTitle(book).toLocaleLowerCase();
}

function compareBooksByReleaseDate(
  a: Book,
  b: Book,
  direction: 1 | -1,
): number {
  const aPrecision = getReleaseDatePrecision(a.releaseDate);
  const bPrecision = getReleaseDatePrecision(b.releaseDate);

  if (aPrecision === "day" && bPrecision !== "day") return -1;
  if (aPrecision !== "day" && bPrecision === "day") return 1;

  const byDate = a.releaseDate.localeCompare(b.releaseDate) * direction;
  return byDate || getBookSortTitle(a).localeCompare(getBookSortTitle(b));
}

export function groupBooks(books: Book[], today = getTodayIso()): BookGroups {
  const groups: BookGroups = { upcoming: [], available: [], unknown: [] };

  for (const book of books) {
    groups[resolveBookStatus(book, today)].push(book);
  }

  groups.upcoming.sort((a, b) => compareBooksByReleaseDate(a, b, 1));
  groups.available.sort((a, b) => compareBooksByReleaseDate(a, b, 1));
  groups.unknown.sort((a, b) => compareBooksByReleaseDate(a, b, 1));
  return groups;
}

function toReleaseGroup(book: Book): Omit<BookReleaseGroup, "books"> {
  const precision = getReleaseDatePrecision(book.releaseDate);
  const year = book.releaseDate.slice(0, 4);
  const month =
    precision === "month" || precision === "day"
      ? book.releaseDate.slice(5, 7)
      : undefined;

  return {
    key: month ? `${year}-${month}` : year,
    year,
    month,
  };
}

function compareReleaseGroups(
  a: BookReleaseGroup,
  b: BookReleaseGroup,
  direction: 1 | -1,
): number {
  const byYear = a.year.localeCompare(b.year) * direction;
  if (byYear) return byYear;

  if (a.month && !b.month) return -1;
  if (!a.month && b.month) return 1;
  if (!a.month || !b.month) return 0;

  return a.month.localeCompare(b.month) * direction;
}

export function groupBooksByReleasePeriod(
  books: Book[],
  order: "asc" | "desc" = "asc",
): BookReleaseGroup[] {
  const grouped = new Map<string, BookReleaseGroup>();

  for (const book of books) {
    const period = toReleaseGroup(book);
    const existing = grouped.get(period.key);
    if (existing) existing.books.push(book);
    else grouped.set(period.key, { ...period, books: [book] });
  }

  const direction: 1 | -1 = order === "asc" ? 1 : -1;
  return [...grouped.values()]
    .sort((a, b) => compareReleaseGroups(a, b, direction))
    .map((group) => ({
      ...group,
      books: [...group.books].sort((a, b) =>
        compareBooksByReleaseDate(a, b, direction),
      ),
    }));
}

export function groupBooksByTimelinePeriod(
  books: Book[],
  today = getTodayIso(),
): BookReleaseGroup[] {
  const currentYear = today.slice(0, 4);
  const currentMonth = today.slice(0, 7);
  const groups = groupBooksByReleasePeriod(books, "asc");

  const category = (group: BookReleaseGroup): 0 | 1 | 2 | 3 => {
    if (group.key === currentMonth) return 0;
    if (!group.month && group.year === currentYear) return 1;

    const isFuture =
      group.year > currentYear ||
      (group.year === currentYear && Boolean(group.month) && group.key > currentMonth);

    return isFuture ? 2 : 3;
  };

  return [...groups].sort((a, b) => {
    const categoryA = category(a);
    const categoryB = category(b);
    if (categoryA !== categoryB) return categoryA - categoryB;

    if (categoryA === 2) return compareReleaseGroups(a, b, 1);
    if (categoryA === 3) return compareReleaseGroups(a, b, -1);
    return 0;
  });
}

export function buildBookTimeline(
  books: Book[],
  today = getTodayIso(),
): BookTimeline {
  const currentYear = today.slice(0, 4);
  const orderedGroups = groupBooksByTimelinePeriod(books, today);
  const activeGroups: BookReleaseGroup[] = [];
  const archivesByYear = new Map<string, BookYearArchive>();

  for (const group of orderedGroups) {
    if (group.year >= currentYear) {
      activeGroups.push(group);
      continue;
    }

    const existing = archivesByYear.get(group.year);
    if (existing) {
      existing.groups.push(group);
      existing.bookCount += group.books.length;
      continue;
    }

    archivesByYear.set(group.year, {
      year: group.year,
      groups: [group],
      bookCount: group.books.length,
    });
  }

  return {
    currentYear,
    activeGroups,
    archives: [...archivesByYear.values()],
  };
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
      !normalizedQuery ||
      searchableValues.some((value) => value.includes(normalizedQuery));
    return matchesPublisher && matchesQuery;
  });
}

export function mergeBooksIgnoringDuplicateIds(local: Book[], incoming: Book[]): Book[] {
  const ids = new Set(local.map((book) => book.id));
  return [...local, ...incoming.filter((book) => !ids.has(book.id))];
}

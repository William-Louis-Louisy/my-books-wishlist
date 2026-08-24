import type { Book } from "@/types/book";
import { isValidReleaseDate } from "@/lib/date";
import { hasValidBookIdentity } from "@/lib/books";

export const BOOK_BACKUP_VERSION = 2 as const;

interface ImportedBookRecord {
  id?: unknown;
  title?: unknown;
  author?: unknown;
  series?: unknown;
  volume?: unknown;
  publisher?: unknown;
  releaseDate?: unknown;
  note?: unknown;
  purchased?: unknown;
  purchasedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  status?: unknown;
  statusOverride?: unknown;
}

interface BookBackupEnvelope {
  version?: unknown;
  exportedAt?: unknown;
  books?: unknown;
}

export interface BookBackupPayload {
  version: typeof BOOK_BACKUP_VERSION;
  exportedAt: string;
  books: Book[];
}

export class BookBackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookBackupValidationError";
  }
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new BookBackupValidationError(
      `Le champ ${field} doit être une chaîne.`,
    );
  }
  return value.trim() || undefined;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BookBackupValidationError(`Le champ ${field} est obligatoire.`);
  }
  return value.trim();
}

function isValidTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function requiredTimestamp(value: unknown, field: string): string {
  const normalized = requiredString(value, field);
  if (!isValidTimestamp(normalized)) {
    throw new BookBackupValidationError(
      `Le champ ${field} doit être une date valide.`,
    );
  }
  return normalized;
}

function optionalTimestamp(value: unknown, field: string): string | undefined {
  const normalized = optionalString(value, field);
  if (!normalized) return undefined;
  if (!isValidTimestamp(normalized)) {
    throw new BookBackupValidationError(
      `Le champ ${field} doit être une date valide.`,
    );
  }
  return normalized;
}

function normalizeImportedBook(value: unknown, index: number): Book {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BookBackupValidationError(
      `L'entrée ${index + 1} n'est pas un livre valide.`,
    );
  }

  const raw = value as ImportedBookRecord;
  const id = requiredString(raw.id, `books[${index}].id`);
  const releaseDate = requiredString(
    raw.releaseDate,
    `books[${index}].releaseDate`,
  );

  if (!isValidReleaseDate(releaseDate)) {
    throw new BookBackupValidationError(
      `La date de sortie de l'entrée ${index + 1} est invalide.`,
    );
  }
  if (typeof raw.purchased !== "boolean") {
    throw new BookBackupValidationError(
      `Le champ purchased de l'entrée ${index + 1} est invalide.`,
    );
  }

  const book: Book = {
    id,
    title: optionalString(raw.title, `books[${index}].title`),
    author: optionalString(raw.author, `books[${index}].author`),
    series: optionalString(raw.series, `books[${index}].series`),
    volume: optionalString(raw.volume, `books[${index}].volume`),
    publisher: optionalString(raw.publisher, `books[${index}].publisher`),
    releaseDate,
    note: optionalString(raw.note, `books[${index}].note`),
    purchased: raw.purchased,
    purchasedAt: raw.purchased
      ? optionalTimestamp(raw.purchasedAt, `books[${index}].purchasedAt`)
      : undefined,
    createdAt: requiredTimestamp(raw.createdAt, `books[${index}].createdAt`),
    updatedAt: requiredTimestamp(raw.updatedAt, `books[${index}].updatedAt`),
  };

  if (!hasValidBookIdentity(book)) {
    throw new BookBackupValidationError(
      `L'entrée ${index + 1} doit contenir un titre ou une série avec un tome.`,
    );
  }

  return book;
}

function getRawBooks(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") {
    throw new BookBackupValidationError(
      "Le fichier n'a pas le format attendu.",
    );
  }

  const envelope = payload as BookBackupEnvelope;
  if (
    envelope.version !== undefined &&
    envelope.version !== 1 &&
    envelope.version !== BOOK_BACKUP_VERSION
  ) {
    throw new BookBackupValidationError(
      "Cette version de sauvegarde n'est pas prise en charge.",
    );
  }
  if (!Array.isArray(envelope.books)) {
    throw new BookBackupValidationError(
      "Le fichier ne contient pas de liste de livres.",
    );
  }

  return envelope.books;
}

export function createBookBackupPayload(books: Book[]): BookBackupPayload {
  return {
    version: BOOK_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    books,
  };
}

export function serializeBookBackup(books: Book[]): string {
  return JSON.stringify(createBookBackupPayload(books), null, 2);
}

export function parseBookBackup(payload: unknown): Book[] {
  const rawBooks = getRawBooks(payload);
  const ids = new Set<string>();

  return rawBooks.map((rawBook, index) => {
    const book = normalizeImportedBook(rawBook, index);
    if (ids.has(book.id)) {
      throw new BookBackupValidationError(
        `L'identifiant ${book.id} apparaît plusieurs fois dans la sauvegarde.`,
      );
    }
    ids.add(book.id);
    return book;
  });
}

export function parseBookBackupJson(content: string): Book[] {
  let payload: unknown;
  try {
    payload = JSON.parse(content) as unknown;
  } catch {
    throw new BookBackupValidationError(
      "Le fichier ne contient pas un JSON valide.",
    );
  }
  return parseBookBackup(payload);
}

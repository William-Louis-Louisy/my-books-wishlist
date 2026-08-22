import { db } from "@/lib/db";
import type { Book, BookDraft } from "@/types/book";

function normalizeOptional(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export async function createBook(draft: BookDraft): Promise<Book> {
  const now = new Date().toISOString();
  const book: Book = {
    id: crypto.randomUUID(),
    title: normalizeOptional(draft.title),
    author: normalizeOptional(draft.author),
    series: normalizeOptional(draft.series),
    volume: normalizeOptional(draft.volume),
    publisher: normalizeOptional(draft.publisher),
    releaseDate: draft.releaseDate,
    note: normalizeOptional(draft.note),
    purchased: draft.purchased,
    purchasedAt: draft.purchased ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.books.add(book);
  return book;
}

export async function updateBook(id: string, draft: BookDraft): Promise<Book> {
  const current = await db.books.get(id);
  if (!current) throw new Error("Livre introuvable.");

  const now = new Date().toISOString();
  const purchasedAt = draft.purchased
    ? current.purchasedAt ?? now
    : undefined;
  const updated: Book = {
    id: current.id,
    title: normalizeOptional(draft.title),
    author: normalizeOptional(draft.author),
    series: normalizeOptional(draft.series),
    volume: normalizeOptional(draft.volume),
    publisher: normalizeOptional(draft.publisher),
    releaseDate: draft.releaseDate,
    note: normalizeOptional(draft.note),
    purchased: draft.purchased,
    purchasedAt,
    createdAt: current.createdAt,
    updatedAt: now,
  };
  await db.books.put(updated);
  return updated;
}

export async function deleteBook(id: string): Promise<void> {
  await db.books.delete(id);
}

export async function togglePurchased(id: string): Promise<void> {
  const book = await db.books.get(id);
  if (!book) return;
  const purchased = !book.purchased;
  await db.books.update(id, {
    purchased,
    purchasedAt: purchased ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  });
}

import { db } from "@/lib/db";
import { deriveStatus } from "@/lib/books";
import { queueDriveExport } from "@/lib/drive-sync";
import type { Book, BookDraft } from "@/types/book";

export async function createBook(draft: BookDraft): Promise<Book> {
  const now = new Date().toISOString();
  const status = draft.statusOverride ?? deriveStatus(draft.releaseDate);
  const book: Book = {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    author: draft.author.trim(),
    publisher: draft.publisher.trim(),
    releaseDate: draft.releaseDate,
    note: draft.note?.trim() || undefined,
    status,
    statusOverride: draft.statusOverride ?? null,
    purchased: draft.purchased,
    purchasedAt: draft.purchased ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.books.add(book);
  queueDriveExport();
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
    ...current,
    title: draft.title.trim(),
    author: draft.author.trim(),
    publisher: draft.publisher.trim(),
    releaseDate: draft.releaseDate,
    note: draft.note?.trim() || undefined,
    status: draft.statusOverride ?? deriveStatus(draft.releaseDate),
    statusOverride: draft.statusOverride ?? null,
    purchased: draft.purchased,
    purchasedAt,
    updatedAt: now,
  };
  await db.books.put(updated);
  queueDriveExport();
  return updated;
}

export async function deleteBook(id: string): Promise<void> {
  await db.books.delete(id);
  queueDriveExport();
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
  queueDriveExport();
}

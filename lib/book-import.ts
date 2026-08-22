import { db } from "@/lib/db";
import type { Book } from "@/types/book";

export type BookImportMode = "replace" | "merge";

export async function applyBookImport(
  incoming: Book[],
  mode: BookImportMode,
): Promise<number> {
  if (mode === "replace") {
    await db.transaction("rw", db.books, async () => {
      await db.books.clear();
      if (incoming.length) await db.books.bulkPut(incoming);
    });
    return incoming.length;
  }

  const localIds = new Set((await db.books.toArray()).map((book) => book.id));
  const additions = incoming.filter((book) => !localIds.has(book.id));
  if (additions.length) await db.books.bulkPut(additions);
  return additions.length;
}

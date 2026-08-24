import type { Book } from "@/types/book";
import Dexie, { type EntityTable } from "dexie";

interface LegacyBookRecord extends Book {
  status?: unknown;
  statusOverride?: unknown;
}

class BookWishlistDatabase extends Dexie {
  books!: EntityTable<Book, "id">;

  constructor() {
    super("book-wishlist");
    this.version(1).stores({
      books: "id, releaseDate, publisher, updatedAt",
    });
    this.version(2)
      .stores({
        books: "id, releaseDate, publisher, updatedAt",
      })
      .upgrade((transaction) =>
        transaction
          .table("books")
          .toCollection()
          .modify((book: LegacyBookRecord) => {
            delete book.status;
            delete book.statusOverride;
            if (!book.title?.trim()) delete book.title;
            if (!book.author?.trim()) delete book.author;
            if (!book.publisher?.trim()) delete book.publisher;
          }),
      );
  }
}

export const db = new BookWishlistDatabase();

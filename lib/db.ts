import Dexie, { type EntityTable } from "dexie";
import type { Book } from "@/types/book";

class BookWishlistDatabase extends Dexie {
  books!: EntityTable<Book, "id">;

  constructor() {
    super("book-wishlist");
    this.version(1).stores({
      books: "id, releaseDate, publisher, updatedAt",
    });
  }
}

export const db = new BookWishlistDatabase();

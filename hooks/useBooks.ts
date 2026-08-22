"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { Book } from "@/types/book";

export function useBooks(): { books: Book[]; loading: boolean; error?: Error } {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const subscription = liveQuery(() => db.books.toArray()).subscribe({
      next: (value) => {
        setBooks(value);
        setLoading(false);
      },
      error: (reason: unknown) => {
        setError(reason instanceof Error ? reason : new Error("Lecture locale impossible."));
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  return { books, loading, error };
}

export function useBook(id?: string): { book?: Book; loading: boolean } {
  const [book, setBook] = useState<Book>();
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const subscription = liveQuery(() => db.books.get(id)).subscribe({
      next: (value) => {
        setBook(value);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => subscription.unsubscribe();
  }, [id]);

  return { book, loading };
}

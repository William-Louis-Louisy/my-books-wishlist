"use client";

import { AppHeader } from "@/components/AppHeader";
import { BookList } from "@/components/BookList";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useBooks } from "@/hooks/useBooks";

export default function HomePage() {
  const { books, loading, error } = useBooks();
  return (
    <>
      <AppHeader showSettings showSync />
      <main className="mx-auto max-w-app px-page">
        {loading ? <p className="py-16 text-center font-display italic text-ink-muted">Ouverture de votre liste…</p> : null}
        {error ? <p className="py-16 text-center text-sm text-ink-muted">La liste locale n’a pas pu être ouverte.</p> : null}
        {!loading && !error ? <BookList books={books} /> : null}
      </main>
      <FloatingActionButton />
    </>
  );
}

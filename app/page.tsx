"use client";

import { useTranslations } from "next-intl";
import { useBooks } from "@/hooks/useBooks";
import { BookList } from "@/components/BookList";
import { AppHeader } from "@/components/AppHeader";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FloatingActionButton } from "@/components/FloatingActionButton";

export default function HomePage() {
  const t = useTranslations("Home");
  const { books, loading, error } = useBooks();

  return (
    <>
      <AppHeader showSettings />
      <main className="mx-auto max-w-app">
        {loading ? (
          <p className="py-16 text-center font-display italic text-ink-muted">
            {t("opening")}
          </p>
        ) : null}
        {error ? (
          <p className="py-16 text-center text-sm text-ink-muted">
            {t("error")}
          </p>
        ) : null}
        {!loading && !error ? (
          <>
            <InstallPrompt bookCount={books.length} />
            <BookList books={books} />
          </>
        ) : null}
      </main>
      <FloatingActionButton />
    </>
  );
}

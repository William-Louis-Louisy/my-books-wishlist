"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookCard } from "@/components/BookCard";
import { FilterPanel } from "@/components/FilterPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { filterBooks, groupBooks } from "@/lib/books";
import type { Book } from "@/types/book";

interface BookListProps {
  books: Book[];
}

export function BookList({ books }: BookListProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [publisher, setPublisher] = useState("");
  const [purchasedOpen, setPurchasedOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const publishers = useMemo(() => [...new Set(books.map((book) => book.publisher))].sort((a, b) => a.localeCompare(b, "fr")), [books]);
  const groups = useMemo(() => groupBooks(filterBooks(books, query, publisher)), [books, query, publisher]);
  const filteredCount = groups.upcoming.length + groups.available.length + groups.purchased.length;

  const renderCards = (items: Book[]) => (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((book) => <BookCard key={book.id} book={book} />)}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <FilterPanel
        open={filtersOpen}
        onToggle={() => setFiltersOpen((value) => !value)}
        query={query}
        onQueryChange={setQuery}
        publisher={publisher}
        onPublisherChange={setPublisher}
        publishers={publishers}
      />

      {filteredCount === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-base italic text-ink">{books.length === 0 ? "Aucun livre en attente pour l'instant." : "Aucun livre ne correspond à cette recherche."}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">{books.length === 0 ? "Ajoutez le premier titre à surveiller." : "Modifiez vos critères pour retrouver un titre."}</p>
        </div>
      ) : (
        <div className="pb-28">
          {groups.upcoming.length ? <section><SectionHeader label="À paraître" />{renderCards(groups.upcoming)}</section> : null}
          {groups.available.length ? <section className="mt-5"><SectionHeader label="Disponibles" />{renderCards(groups.available)}</section> : null}
          {groups.purchased.length ? (
            <section className="mt-5">
              <SectionHeader label="Acheté" count={groups.purchased.length} collapsible expanded={purchasedOpen} onToggle={() => setPurchasedOpen((value) => !value)} />
              <AnimatePresence initial={false}>
                {purchasedOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    {renderCards(groups.purchased)}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

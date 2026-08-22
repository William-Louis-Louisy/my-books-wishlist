"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { BookCard } from "@/components/BookCard";
import { FilterPanel } from "@/components/FilterPanel";
import { SectionHeader } from "@/components/SectionHeader";
import {
  filterBooks,
  groupBooks,
  groupBooksByReleaseMonth,
  groupBooksByTimelineMonth,
  type BookOrganizationMode,
} from "@/lib/books";
import { formatMonthLabel } from "@/lib/date";
import type { Book } from "@/types/book";

interface BookListProps {
  books: Book[];
}

type StatusAccent = "brass" | "cloth";

export function BookList({ books }: BookListProps) {
  const tHome = useTranslations("Home");
  const tSections = useTranslations("Sections");
  const locale = useLocale();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [publisher, setPublisher] = useState("");
  const [organization, setOrganization] =
    useState<BookOrganizationMode>("month");

  const publishers = useMemo(
    () =>
      [...new Set(books.map((book) => book.publisher.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, locale),
      ),
    [books, locale],
  );
  const filteredBooks = useMemo(
    () => filterBooks(books, query, publisher),
    [books, query, publisher],
  );
  const statusGroups = useMemo(
    () => groupBooks(filteredBooks),
    [filteredBooks],
  );
  const timelineGroups = useMemo(
    () => groupBooksByTimelineMonth(filteredBooks),
    [filteredBooks],
  );

  const renderCards = (items: Book[]) => (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </AnimatePresence>
    </div>
  );

  const renderStatusMonthGroups = (
    items: Book[],
    order: "asc" | "desc",
    accent: StatusAccent,
  ) => (
    <div className="space-y-5">
      {groupBooksByReleaseMonth(items, order).map((group) => (
        <div key={group.month}>
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${
                accent === "brass" ? "bg-brass" : "bg-cloth"
              }`}
            />
            {formatMonthLabel(group.month, locale)}
          </h3>
          {renderCards(group.books)}
        </div>
      ))}
    </div>
  );

  const renderMonthlyTimeline = () => (
    <div className="space-y-6 pb-28">
      {timelineGroups.map((group) => (
        <section key={group.month}>
          <h2 className="px-page my-2 font-display text-sm font-semibold text-ink">
            {formatMonthLabel(group.month, locale)}
          </h2>
          {renderCards(group.books)}
        </section>
      ))}
    </div>
  );

  const renderStatusOrganization = () => (
    <div className="pb-28">
      {statusGroups.upcoming.length ? (
        <section>
          <SectionHeader label={tSections("upcoming")} />
          {renderStatusMonthGroups(statusGroups.upcoming, "asc", "brass")}
        </section>
      ) : null}
      {statusGroups.available.length ? (
        <section className="mt-5">
          <SectionHeader label={tSections("available")} />
          {renderStatusMonthGroups(statusGroups.available, "desc", "cloth")}
        </section>
      ) : null}
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
        organization={organization}
        onOrganizationChange={setOrganization}
      />

      {filteredBooks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-base italic text-ink">
            {books.length === 0 ? tHome("emptyTitle") : tHome("noResultsTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">
            {books.length === 0 ? tHome("emptyBody") : tHome("noResultsBody")}
          </p>
        </div>
      ) : organization === "month" ? (
        renderMonthlyTimeline()
      ) : (
        renderStatusOrganization()
      )}
    </>
  );
}

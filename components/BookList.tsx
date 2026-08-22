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
  groupBooksByReleasePeriod,
  groupBooksByTimelinePeriod,
  type BookOrganizationMode,
  type BookReleaseGroup,
} from "@/lib/books";
import { formatMonthLabel } from "@/lib/date";
import type { Book } from "@/types/book";

interface BookListProps {
  books: Book[];
}

type StatusAccent = "brass" | "cloth" | "neutral";

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
      [
        ...new Set(
          books
            .map((book) => book.publisher?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((a, b) => a.localeCompare(b, locale)),
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
    () => groupBooksByTimelinePeriod(filteredBooks),
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

  const releaseGroupLabel = (group: BookReleaseGroup) =>
    group.month
      ? formatMonthLabel(group.key, locale)
      : tSections("monthUnspecified", { year: group.year });

  const accentClass = (accent: StatusAccent) => {
    if (accent === "brass") return "bg-brass";
    if (accent === "cloth") return "bg-cloth";
    return "bg-ink-muted/40";
  };

  const renderStatusReleaseGroups = (
    items: Book[],
    order: "asc" | "desc",
    accent: StatusAccent,
  ) => (
    <div className="space-y-5">
      {groupBooksByReleasePeriod(items, order).map((group) => (
        <div key={group.key}>
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${accentClass(accent)}`}
            />
            {releaseGroupLabel(group)}
          </h3>
          {renderCards(group.books)}
        </div>
      ))}
    </div>
  );

  const renderMonthlyTimeline = () => (
    <div className="space-y-6 pb-28">
      {timelineGroups.map((group) => (
        <section key={group.key}>
          <h2 className="my-2 px-page font-display text-sm font-semibold text-ink">
            {releaseGroupLabel(group)}
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
          {renderStatusReleaseGroups(statusGroups.upcoming, "asc", "brass")}
        </section>
      ) : null}
      {statusGroups.unknown.length ? (
        <section className="mt-5">
          <SectionHeader label={tSections("unknown")} />
          {renderStatusReleaseGroups(statusGroups.unknown, "asc", "neutral")}
        </section>
      ) : null}
      {statusGroups.available.length ? (
        <section className="mt-5">
          <SectionHeader label={tSections("available")} />
          {renderStatusReleaseGroups(statusGroups.available, "desc", "cloth")}
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

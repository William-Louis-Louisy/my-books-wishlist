"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { BookCard } from "@/components/BookCard";
import { FilterPanel } from "@/components/FilterPanel";
import { ChevronIcon } from "@/components/Icons";
import { SectionHeader } from "@/components/SectionHeader";
import {
  buildBookTimeline,
  filterBooks,
  groupBooks,
  groupBooksByReleasePeriod,
  type BookOrganizationMode,
  type BookReleaseGroup,
  type BookYearArchive,
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
  const [expandedArchiveYears, setExpandedArchiveYears] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    () => new Set(),
  );

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
  const timeline = useMemo(
    () => buildBookTimeline(filteredBooks),
    [filteredBooks],
  );
  const hasActiveFilter = Boolean(query.trim() || publisher);

  const toggleArchiveYear = (year: string) => {
    setExpandedArchiveYears((current) => {
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((current) => {
      const next = new Set(current);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  const renderCards = (items: Book[]) => (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </AnimatePresence>
    </div>
  );

  const releaseGroupLabel = (
    group: BookReleaseGroup,
    withinArchive = false,
  ) => {
    if (group.month) return formatMonthLabel(group.key, locale);
    if (withinArchive) return tSections("monthUnspecifiedShort");
    return tSections("monthUnspecified", { year: group.year });
  };

  const accentClass = (accent: StatusAccent) => {
    if (accent === "brass") return "bg-[var(--accent-brass)]";
    if (accent === "cloth") return "bg-[var(--accent-cloth)]";
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

  const renderTimelineGroup = (
    group: BookReleaseGroup,
    withinArchive = false,
  ) => {
    const label = releaseGroupLabel(group, withinArchive);

    if (!group.month) {
      return (
        <div key={group.key}>
          <h3 className="mb-2 px-page font-display text-sm font-semibold text-ink">
            {label}
          </h3>
          {renderCards(group.books)}
        </div>
      );
    }

    const expanded = hasActiveFilter || !collapsedMonths.has(group.key);
    const panelId = `book-month-${group.key}`;

    return (
      <section key={group.key}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={tSections(
            expanded ? "monthCollapse" : "monthExpand",
            { month: label },
          )}
          disabled={hasActiveFilter}
          onClick={() => toggleMonth(group.key)}
          className="my-2 flex w-full items-center gap-3 px-page py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brass disabled:cursor-default"
        >
          <span className="font-display text-sm font-semibold text-ink">
            {label}
          </span>
          <span className="ml-auto text-xs text-ink-muted">
            {tSections("monthBooks", { count: group.books.length })}
          </span>
          <ChevronIcon
            className={`size-4 shrink-0 text-ink-muted transition-transform duration-200 motion-reduce:transition-none ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>
        {expanded ? <div id={panelId}>{renderCards(group.books)}</div> : null}
      </section>
    );
  };

  const renderArchive = (archive: BookYearArchive) => {
    const expanded = hasActiveFilter || expandedArchiveYears.has(archive.year);
    const panelId = `book-archive-${archive.year}`;

    return (
      <section
        key={archive.year}
        className="border-t border-line last:border-b"
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={tSections(
            expanded ? "archiveCollapse" : "archiveExpand",
            { year: archive.year },
          )}
          disabled={hasActiveFilter}
          onClick={() => toggleArchiveYear(archive.year)}
          className="flex w-full items-center gap-3 px-page py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brass disabled:cursor-default"
        >
          <span className="font-display text-base font-semibold text-ink">
            {archive.year}
          </span>
          <span className="ml-auto text-xs text-ink-muted">
            {tSections("archiveBooks", { count: archive.bookCount })}
          </span>
          <ChevronIcon
            className={`size-4 shrink-0 text-ink-muted transition-transform duration-200 motion-reduce:transition-none ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {expanded ? (
          <div id={panelId} className="space-y-5 pb-5">
            {archive.groups.map((group) => renderTimelineGroup(group, true))}
          </div>
        ) : null}
      </section>
    );
  };

  const renderMonthlyTimeline = () => (
    <div className="pb-28">
      {timeline.activeGroups.length ? (
        <div className="space-y-6">
          {timeline.activeGroups.map((group) => renderTimelineGroup(group))}
        </div>
      ) : null}

      {timeline.archives.length ? (
        <div className={timeline.activeGroups.length ? "mt-6" : ""}>
          {timeline.archives.map(renderArchive)}
        </div>
      ) : null}
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

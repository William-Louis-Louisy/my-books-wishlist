"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { FilterIcon, SearchIcon } from "@/components/Icons";

interface FilterPanelProps {
  open: boolean;
  onToggle: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  publisher: string;
  onPublisherChange: (value: string) => void;
  publishers: string[];
}

export function FilterPanel({ open, onToggle, query, onQueryChange, publisher, onPublisherChange, publishers }: FilterPanelProps) {
  const t = useTranslations("Filters");
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-b border-line/80">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2 py-3 text-sm text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">
        <FilterIcon className="size-4" />
        {t("toggle")}
        {(query || publisher) ? <span className="ml-auto size-1.5 rounded-full bg-brass" aria-label={t("active")} /> : null}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 pb-4 sm:grid-cols-2">
              <label className="block">
                <span className="sr-only">{t("searchLabel")}</span>
                <span className="flex items-center gap-2 border-b border-line py-2 focus-within:border-b-2 focus-within:border-brass">
                  <SearchIcon className="size-4 text-ink-muted" />
                  <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("placeholder")} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted/70" />
                </span>
              </label>
              <label className="block">
                <span className="sr-only">{t("publisherLabel")}</span>
                <select value={publisher} onChange={(event) => onPublisherChange(event.target.value)} className="w-full border-0 border-b border-line bg-paper py-2 text-sm text-ink outline-none focus:border-b-2 focus:border-brass">
                  <option value="">{t("allPublishers")}</option>
                  {publishers.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

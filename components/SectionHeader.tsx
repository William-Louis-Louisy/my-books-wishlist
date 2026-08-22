"use client";

import { ChevronIcon } from "@/components/Icons";

interface SectionHeaderProps {
  label: string;
  count?: number;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({ label, count, collapsible, expanded, onToggle }: SectionHeaderProps) {
  const content = (
    <>
      <span>{label}{typeof count === "number" ? ` (${count})` : ""}</span>
      {collapsible ? (
        <ChevronIcon className={`size-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`} />
      ) : null}
    </>
  );

  const className = "flex w-full items-center justify-between py-3 text-left font-sans text-xs font-medium uppercase tracking-[0.08em] text-ink-muted";

  return collapsible ? (
    <button type="button" className={`${className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass`} onClick={onToggle} aria-expanded={expanded}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, SettingsIcon } from "@/components/Icons";
import { SyncDot } from "@/components/SyncDot";

interface AppHeaderProps {
  title?: string;
  backHref?: string;
  showSettings?: boolean;
  showSync?: boolean;
}

export function AppHeader({
  title,
  backHref,
  showSettings = false,
  showSync = false,
}: AppHeaderProps) {
  const t = useTranslations("Common");

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-app items-center gap-3 px-page">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={t("back")}
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <ArrowLeftIcon />
          </Link>
        ) : null}
        <h1 className="font-display text-[1.375rem] font-semibold leading-tight text-ink">{title ?? t("appName")}</h1>
        <div className="ml-auto flex items-center gap-1">
          {showSync ? <SyncDot /> : null}
          {showSettings ? (
            <Link
              href="/settings"
              aria-label={t("settings")}
              className="grid size-9 place-items-center rounded-full text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass motion-reduce:transition-none"
            >
              <SettingsIcon />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

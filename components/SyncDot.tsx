"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/date";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export function SyncDot() {
  const t = useTranslations("Sync");
  const common = useTranslations("Common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const sync = useSyncStatus();
  const color =
    sync.state === "synced"
      ? "bg-cloth"
      : sync.state === "error"
        ? "bg-sync-error"
        : sync.state === "disconnected"
          ? "bg-ink-muted/35"
          : "bg-brass";
  const statusLabel =
    sync.state === "synced"
      ? t("synced")
      : sync.state === "disconnected"
        ? t("disconnected")
        : sync.state === "error"
          ? t("error")
          : t("pending");

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("viewAria")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span className={`size-1.5 rounded-full ${color}`} />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-30 w-64 rounded-card border border-line bg-paper p-3 text-xs text-ink shadow-none">
          <p className="font-medium">{statusLabel}</p>
          <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.02em] text-ink-muted">
            {t("lastBackup", {
              date: formatDateTime(sync.lastExportAt, locale, common("never")),
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}

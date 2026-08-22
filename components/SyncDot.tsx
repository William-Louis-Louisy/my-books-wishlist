"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/date";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export function SyncDot() {
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

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Voir l'état de la sauvegarde"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span className={`size-1.5 rounded-full ${color}`} />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-30 w-64 rounded-card border border-line bg-paper p-3 text-xs text-ink shadow-none">
          <p className="font-medium">
            {sync.state === "synced"
              ? "Sauvegarde Drive à jour"
              : sync.state === "disconnected"
                ? "Sauvegarde Drive non connectée"
                : sync.message ?? "Sauvegarde en attente"}
          </p>
          <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.02em] text-ink-muted">
            Dernière sauvegarde · {formatDateTime(sync.lastExportAt)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

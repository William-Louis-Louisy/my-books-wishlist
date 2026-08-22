"use client";

import { useEffect, useState } from "react";
import {
  readSyncSnapshot,
  subscribeToSyncSnapshot,
  type SyncSnapshot,
} from "@/lib/sync-status";

export function useSyncStatus(): SyncSnapshot {
  const [snapshot, setSnapshot] = useState<SyncSnapshot>({ state: "disconnected" });

  useEffect(() => {
    setSnapshot(readSyncSnapshot());
    return subscribeToSyncSnapshot(setSnapshot);
  }, []);

  return snapshot;
}

"use client";

import { useSyncExternalStore } from "react";
import {
  getDefaultSyncSnapshot,
  readSyncSnapshot,
  subscribeToSyncSnapshot,
  type SyncSnapshot,
} from "@/lib/sync-status";

function subscribe(onStoreChange: () => void): () => void {
  return subscribeToSyncSnapshot(() => onStoreChange());
}

export function useSyncStatus(): SyncSnapshot {
  return useSyncExternalStore(subscribe, readSyncSnapshot, getDefaultSyncSnapshot);
}

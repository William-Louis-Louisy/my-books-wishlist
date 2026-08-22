export type SyncState = "idle" | "pending" | "synced" | "error" | "disconnected";

export interface SyncSnapshot {
  state: SyncState;
  lastExportAt?: string;
  message?: string;
}

const STORAGE_KEY = "book-wishlist:sync-status";
const EVENT_NAME = "book-wishlist:sync-status-change";
const DEFAULT_SNAPSHOT: SyncSnapshot = Object.freeze({ state: "disconnected" });

let cachedRaw: string | null | undefined;
let cachedSnapshot: SyncSnapshot = DEFAULT_SNAPSHOT;

export function getDefaultSyncSnapshot(): SyncSnapshot {
  return DEFAULT_SNAPSHOT;
}

export function readSyncSnapshot(): SyncSnapshot {
  if (typeof window === "undefined") return DEFAULT_SNAPSHOT;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = DEFAULT_SNAPSHOT;
    return cachedSnapshot;
  }

  try {
    cachedSnapshot = JSON.parse(raw) as SyncSnapshot;
  } catch {
    cachedSnapshot = DEFAULT_SNAPSHOT;
  }

  return cachedSnapshot;
}

export function writeSyncSnapshot(snapshot: SyncSnapshot): void {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(snapshot);
  cachedRaw = raw;
  cachedSnapshot = snapshot;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: snapshot }));
}

export function subscribeToSyncSnapshot(callback: (snapshot: SyncSnapshot) => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<SyncSnapshot>).detail;
    callback(detail ?? readSyncSnapshot());
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback(readSyncSnapshot());
  };

  window.addEventListener(EVENT_NAME, onCustomEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustomEvent);
    window.removeEventListener("storage", onStorage);
  };
}

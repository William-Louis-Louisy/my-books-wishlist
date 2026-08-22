export type SyncState = "idle" | "pending" | "synced" | "error" | "disconnected";

export interface SyncSnapshot {
  state: SyncState;
  lastExportAt?: string;
  message?: string;
}

const STORAGE_KEY = "book-wishlist:sync-status";
const EVENT_NAME = "book-wishlist:sync-status-change";

const defaultSnapshot: SyncSnapshot = { state: "disconnected" };

export function readSyncSnapshot(): SyncSnapshot {
  if (typeof window === "undefined") return defaultSnapshot;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultSnapshot;
  try {
    return JSON.parse(raw) as SyncSnapshot;
  } catch {
    return defaultSnapshot;
  }
}

export function writeSyncSnapshot(snapshot: SyncSnapshot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
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

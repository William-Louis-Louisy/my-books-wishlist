import { db } from "@/lib/db";
import { hasValidBookIdentity, mergeBooksIgnoringDuplicateIds } from "@/lib/books";
import { isValidReleaseDate } from "@/lib/date";
import { writeSyncSnapshot } from "@/lib/sync-status";
import type { Book } from "@/types/book";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FILE_NAME = "book-wishlist-export.json";
const DRIVE_CONNECTED_KEY = "book-wishlist:drive-connected";
const DRIVE_EMAIL_KEY = "book-wishlist:drive-email";
const DRIVE_FILE_ID_KEY = "book-wishlist:drive-file-id";
const DEBOUNCE_MS = 5_000;

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleOauth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: unknown) => void;
  }) => GoogleTokenClient;
  revoke?: (token: string, callback?: () => void) => void;
}

interface ImportedBookRecord {
  id?: unknown;
  title?: unknown;
  author?: unknown;
  series?: unknown;
  volume?: unknown;
  publisher?: unknown;
  releaseDate?: unknown;
  note?: unknown;
  purchased?: unknown;
  purchasedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  status?: unknown;
  statusOverride?: unknown;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleOauth2;
      };
    };
  }
}

let accessToken: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let exportInFlight: Promise<void> | null = null;

function getClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("Google Drive est disponible uniquement dans le navigateur.");
  }
}

async function loadGoogleIdentityServices(): Promise<void> {
  ensureBrowser();
  if (window.google?.accounts.oauth2) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services indisponible.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services indisponible."));
    document.head.appendChild(script);
  });
}

async function requestAccessToken(interactive: boolean): Promise<string> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("La connexion Google Drive n'est pas configurée.");
  }
  if (accessToken) return accessToken;

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    const oauth2 = window.google?.accounts.oauth2;
    if (!oauth2) {
      reject(new Error("Google Identity Services indisponible."));
      return;
    }

    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? "Connexion Google refusée."));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
      error_callback: () => reject(new Error("Connexion Google interrompue.")),
    });

    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

async function driveFetch(path: string, init: RequestInit = {}, interactive = false): Promise<Response> {
  const token = await requestAccessToken(interactive);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(path, { ...init, headers });
  if (response.status !== 401) return response;

  accessToken = null;
  const refreshed = await requestAccessToken(false);
  headers.set("Authorization", `Bearer ${refreshed}`);
  response = await fetch(path, { ...init, headers });
  return response;
}

async function getDriveAccountEmail(): Promise<string | undefined> {
  const response = await driveFetch(
    "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
  );
  if (!response.ok) return undefined;
  const data = (await response.json()) as { user?: { emailAddress?: string } };
  return data.user?.emailAddress;
}

async function findDriveFileId(): Promise<string | null> {
  ensureBrowser();
  const cached = window.localStorage.getItem(DRIVE_FILE_ID_KEY);
  if (cached) return cached;

  const query = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`,
  );
  if (!response.ok) throw new Error("Impossible de retrouver la sauvegarde Drive.");
  const data = (await response.json()) as { files?: Array<{ id: string }> };
  const id = data.files?.[0]?.id ?? null;
  if (id) window.localStorage.setItem(DRIVE_FILE_ID_KEY, id);
  return id;
}

async function createDriveFile(content: string): Promise<string> {
  const boundary = `book-wishlist-${crypto.randomUUID()}`;
  const multipartBody = [
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify({ name: DRIVE_FILE_NAME, mimeType: "application/json" }),
    `\r\n--${boundary}\r\n`,
    "Content-Type: application/json\r\n\r\n",
    content,
    `\r\n--${boundary}--`,
  ].join("");

  const response = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipartBody,
    },
  );
  if (!response.ok) throw new Error("La première sauvegarde Drive a échoué.");
  const data = (await response.json()) as { id: string };
  window.localStorage.setItem(DRIVE_FILE_ID_KEY, data.id);
  return data.id;
}

async function updateDriveFile(fileId: string, content: string): Promise<void> {
  const response = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: content,
    },
  );
  if (!response.ok) throw new Error("La sauvegarde Drive a échoué.");
}

function toExportPayload(books: Book[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), books }, null, 2);
}

export function isDriveConfigured(): boolean {
  return Boolean(getClientId());
}

export function isDriveConnected(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DRIVE_CONNECTED_KEY) === "true";
}

export function getDriveEmail(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(DRIVE_EMAIL_KEY) ?? undefined;
}

export async function connectGoogleDrive(): Promise<void> {
  ensureBrowser();
  await requestAccessToken(true);
  window.localStorage.setItem(DRIVE_CONNECTED_KEY, "true");
  const email = await getDriveAccountEmail();
  if (email) window.localStorage.setItem(DRIVE_EMAIL_KEY, email);
  writeSyncSnapshot({ state: "pending", message: "Sauvegarde en attente." });
  await exportBooksToDrive({ interactive: false }).catch(() => undefined);
}

export async function disconnectGoogleDrive(): Promise<void> {
  ensureBrowser();
  if (accessToken && window.google?.accounts.oauth2.revoke) {
    window.google.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
  window.localStorage.removeItem(DRIVE_CONNECTED_KEY);
  window.localStorage.removeItem(DRIVE_EMAIL_KEY);
  window.localStorage.removeItem(DRIVE_FILE_ID_KEY);
  writeSyncSnapshot({ state: "disconnected" });
}

export async function exportBooksToDrive(options: { interactive?: boolean } = {}): Promise<void> {
  ensureBrowser();
  if (!isDriveConfigured() || !isDriveConnected()) return;
  if (exportInFlight) return exportInFlight;

  exportInFlight = (async () => {
    writeSyncSnapshot({ state: "pending", message: "Sauvegarde en cours." });
    try {
      if (options.interactive) await requestAccessToken(true);
      const books = await db.books.toArray();
      const content = toExportPayload(books);
      const fileId = await findDriveFileId();
      if (fileId) await updateDriveFile(fileId, content);
      else await createDriveFile(content);
      const lastExportAt = new Date().toISOString();
      writeSyncSnapshot({ state: "synced", lastExportAt });
    } catch (error) {
      accessToken = null;
      writeSyncSnapshot({
        state: "error",
        message: "Dernière sauvegarde impossible. Nouvel essai à la prochaine ouverture.",
      });
      throw error;
    } finally {
      exportInFlight = null;
    }
  })();

  return exportInFlight;
}

export function queueDriveExport(): void {
  if (typeof window === "undefined" || !isDriveConnected() || !isDriveConfigured()) return;
  writeSyncSnapshot({ state: "pending", message: "Modifications à sauvegarder." });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void exportBooksToDrive().catch(() => undefined);
  }, DEBOUNCE_MS);
}

export async function retryDriveExportWhenVisible(): Promise<void> {
  if (typeof document === "undefined" || document.visibilityState !== "visible") return;
  if (!isDriveConnected() || !isDriveConfigured()) return;
  await exportBooksToDrive().catch(() => undefined);
}

function optionalImportedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeImportedBook(value: unknown): Book | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as ImportedBookRecord;

  if (
    typeof raw.id !== "string" ||
    typeof raw.releaseDate !== "string" ||
    !isValidReleaseDate(raw.releaseDate) ||
    typeof raw.purchased !== "boolean" ||
    typeof raw.createdAt !== "string" ||
    typeof raw.updatedAt !== "string"
  ) {
    return null;
  }

  const book: Book = {
    id: raw.id,
    title: optionalImportedString(raw.title),
    author: optionalImportedString(raw.author),
    series: optionalImportedString(raw.series),
    volume: optionalImportedString(raw.volume),
    publisher: optionalImportedString(raw.publisher),
    releaseDate: raw.releaseDate,
    note: optionalImportedString(raw.note),
    purchased: raw.purchased,
    purchasedAt: optionalImportedString(raw.purchasedAt),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  return hasValidBookIdentity(book) ? book : null;
}

export async function importBooksFromDrive(mode: "replace" | "merge"): Promise<number> {
  ensureBrowser();
  const fileId = await findDriveFileId();
  if (!fileId) throw new Error("Aucune sauvegarde Drive trouvée.");

  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {},
    true,
  );
  if (!response.ok) throw new Error("Impossible de lire la sauvegarde Drive.");

  const payload = (await response.json()) as { books?: unknown[] } | unknown[];
  const rawBooks = Array.isArray(payload) ? payload : payload.books;
  if (!Array.isArray(rawBooks)) throw new Error("Le fichier Drive n'a pas le format attendu.");

  const incoming = rawBooks
    .map(normalizeImportedBook)
    .filter((book): book is Book => book !== null);
  if (incoming.length !== rawBooks.length) {
    throw new Error("Le fichier Drive contient des entrées invalides.");
  }

  if (mode === "replace") {
    await db.transaction("rw", db.books, async () => {
      await db.books.clear();
      await db.books.bulkPut(incoming);
    });
  } else {
    const local = await db.books.toArray();
    const merged = mergeBooksIgnoringDuplicateIds(local, incoming);
    await db.books.bulkPut(merged);
  }

  queueDriveExport();
  return incoming.length;
}

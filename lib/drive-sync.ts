import { db } from "@/lib/db";
import {
  parseBookBackup,
  serializeBookBackup,
} from "@/lib/book-backup";
import {
  applyBookImport,
  type BookImportMode,
} from "@/lib/book-import";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FILE_NAME = "book-wishlist-export.json";
const DRIVE_FILE_ID_KEY = "book-wishlist:drive-file-id";
const DRIVE_LAST_BACKUP_KEY = "book-wishlist:drive-last-backup";
const LEGACY_DRIVE_CONNECTED_KEY = "book-wishlist:drive-connected";
const LEGACY_DRIVE_EMAIL_KEY = "book-wishlist:drive-email";
const LEGACY_SYNC_STATUS_KEY = "book-wishlist:sync-status";

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
let exportInFlight: Promise<string> | null = null;

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
    const existing = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services indisponible.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Google Identity Services indisponible."));
    document.head.appendChild(script);
  });
}

async function requestAccessToken(): Promise<string> {
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
          reject(
            new Error(
              response.error_description ??
                response.error ??
                "Connexion Google refusée.",
            ),
          );
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
      error_callback: () =>
        reject(new Error("Connexion Google interrompue.")),
    });

    client.requestAccessToken();
  });
}

async function driveFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await requestAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(path, { ...init, headers });
  if (response.status !== 401) return response;

  accessToken = null;
  const refreshed = await requestAccessToken();
  headers.set("Authorization", `Bearer ${refreshed}`);
  response = await fetch(path, { ...init, headers });
  return response;
}

async function findDriveFileId(): Promise<string | null> {
  ensureBrowser();
  const cached = window.localStorage.getItem(DRIVE_FILE_ID_KEY);
  if (cached) return cached;

  const query = encodeURIComponent(
    `name='${DRIVE_FILE_NAME}' and trashed=false`,
  );
  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`,
  );
  if (!response.ok) {
    throw new Error("Impossible de retrouver la sauvegarde Drive.");
  }
  const data = (await response.json()) as {
    files?: Array<{ id: string }>;
  };
  const id = data.files?.[0]?.id ?? null;
  if (id) window.localStorage.setItem(DRIVE_FILE_ID_KEY, id);
  return id;
}

async function createDriveFile(content: string): Promise<string> {
  const boundary = `book-wishlist-${crypto.randomUUID()}`;
  const multipartBody = [
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify({
      name: DRIVE_FILE_NAME,
      mimeType: "application/json",
    }),
    `\r\n--${boundary}\r\n`,
    "Content-Type: application/json\r\n\r\n",
    content,
    `\r\n--${boundary}--`,
  ].join("");

  const response = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );
  if (!response.ok) {
    throw new Error("La première sauvegarde Drive a échoué.");
  }
  const data = (await response.json()) as { id: string };
  window.localStorage.setItem(DRIVE_FILE_ID_KEY, data.id);
  return data.id;
}

async function updateDriveFile(
  fileId: string,
  content: string,
): Promise<void> {
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

function migrateLegacyDriveMetadata(): string | undefined {
  ensureBrowser();
  const current = window.localStorage.getItem(DRIVE_LAST_BACKUP_KEY) ?? undefined;
  if (current) return current;

  const legacyRaw = window.localStorage.getItem(LEGACY_SYNC_STATUS_KEY);
  let legacyLastBackup: string | undefined;
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw) as { lastExportAt?: unknown };
      if (typeof legacy.lastExportAt === "string") {
        legacyLastBackup = legacy.lastExportAt;
        window.localStorage.setItem(DRIVE_LAST_BACKUP_KEY, legacyLastBackup);
      }
    } catch {
      // Legacy metadata is optional; invalid data can simply be discarded.
    }
  }

  window.localStorage.removeItem(LEGACY_DRIVE_CONNECTED_KEY);
  window.localStorage.removeItem(LEGACY_DRIVE_EMAIL_KEY);
  window.localStorage.removeItem(LEGACY_SYNC_STATUS_KEY);
  return legacyLastBackup;
}

export function isDriveConfigured(): boolean {
  return Boolean(getClientId());
}

export function getDriveLastBackupAt(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return migrateLegacyDriveMetadata();
}

export async function exportBooksToDrive(): Promise<string> {
  ensureBrowser();
  if (!isDriveConfigured()) {
    throw new Error("La connexion Google Drive n'est pas configurée.");
  }
  if (exportInFlight) return exportInFlight;

  exportInFlight = (async () => {
    await requestAccessToken();
    const books = await db.books.toArray();
    const content = serializeBookBackup(books);
    const fileId = await findDriveFileId();
    if (fileId) await updateDriveFile(fileId, content);
    else await createDriveFile(content);

    const lastExportAt = new Date().toISOString();
    window.localStorage.setItem(DRIVE_LAST_BACKUP_KEY, lastExportAt);
    return lastExportAt;
  })();

  try {
    return await exportInFlight;
  } finally {
    exportInFlight = null;
  }
}

export async function importBooksFromDrive(
  mode: BookImportMode,
): Promise<number> {
  ensureBrowser();
  if (!isDriveConfigured()) {
    throw new Error("La connexion Google Drive n'est pas configurée.");
  }

  await requestAccessToken();
  const fileId = await findDriveFileId();
  if (!fileId) throw new Error("Aucune sauvegarde Drive trouvée.");

  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
  );
  if (!response.ok) {
    throw new Error("Impossible de lire la sauvegarde Drive.");
  }

  const payload = (await response.json()) as unknown;
  const incoming = parseBookBackup(payload);
  return applyBookImport(incoming, mode);
}

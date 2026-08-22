"use client";

import {
  getDriveEmail,
  isDriveConnected,
  isDriveConfigured,
  connectGoogleDrive,
  exportBooksToDrive,
  importBooksFromDrive,
  disconnectGoogleDrive,
} from "@/lib/drive-sync";
import type { Book } from "@/types/book";
import { useBooks } from "@/hooks/useBooks";
import type { AppLocale } from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";
import { setStoredLocale } from "@/lib/locale-store";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useLocale, useTranslations } from "next-intl";
import { formatDateTime, getTodayIso } from "@/lib/date";
import { DriveIcon, ExportIcon, ImportIcon } from "./Icons";
import { useThemePreference } from "@/components/ThemeProvider";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { applyBookImport, type BookImportMode } from "@/lib/book-import";
import { setStoredTheme, type ThemePreference } from "@/lib/theme-store";
import { parseBookBackupJson, serializeBookBackup } from "@/lib/book-backup";

interface PendingLocalImport {
  fileName: string;
  books: Book[];
}

export function SettingsScreen() {
  const t = useTranslations("Settings");
  const common = useTranslations("Common");
  const locale = useLocale();
  const theme = useThemePreference();
  const { books } = useBooks();
  const sync = useSyncStatus();
  const localImportInputRef = useRef<HTMLInputElement>(null);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string>();
  const [busy, setBusy] = useState<string>();
  const [driveMessage, setDriveMessage] = useState<string>();
  const [localMessage, setLocalMessage] = useState<string>();
  const [importChoice, setImportChoice] = useState(false);
  const [pendingLocalImport, setPendingLocalImport] =
    useState<PendingLocalImport>();
  const configured = isDriveConfigured();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setConnected(isDriveConnected());
      setEmail(getDriveEmail());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const runDrive = async (name: string, action: () => Promise<void>) => {
    setBusy(name);
    setDriveMessage(undefined);
    try {
      await action();
    } catch {
      setDriveMessage(t("actionError"));
    } finally {
      setBusy(undefined);
    }
  };

  const connect = () =>
    runDrive("connect", async () => {
      await connectGoogleDrive();
      setConnected(true);
      setEmail(getDriveEmail());
    });

  const disconnect = () =>
    runDrive("disconnect", async () => {
      await disconnectGoogleDrive();
      setConnected(false);
      setEmail(undefined);
    });

  const exportLocal = () => {
    const blob = new Blob([serializeBookBackup(books)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `book-wishlist-local-${getTodayIso()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importDrive = (mode: BookImportMode) =>
    runDrive(`import-${mode}`, async () => {
      const count = await importBooksFromDrive(mode);
      setImportChoice(false);
      setDriveMessage(t("importSuccess", { count }));
    });

  const prepareLocalImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLocalMessage(undefined);
    setPendingLocalImport(undefined);
    try {
      const incoming = parseBookBackupJson(await file.text());
      setPendingLocalImport({ fileName: file.name, books: incoming });
    } catch {
      setLocalMessage(t("localImportInvalid"));
    }
  };

  const importLocal = async (mode: BookImportMode) => {
    if (!pendingLocalImport) return;

    setBusy(`local-import-${mode}`);
    setLocalMessage(undefined);
    try {
      const count = await applyBookImport(pendingLocalImport.books, mode);
      setPendingLocalImport(undefined);
      setLocalMessage(t("localImportSuccess", { count }));
    } catch {
      setLocalMessage(t("actionError"));
    } finally {
      setBusy(undefined);
    }
  };

  const syncMessage =
    sync.state === "synced"
      ? t("syncSynced")
      : sync.state === "error"
        ? t("syncError")
        : sync.state === "pending"
          ? t("syncPending")
          : undefined;

  const buttonSecondary =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50 motion-reduce:transition-none";
  const selectClass =
    "border-0 border-b border-line bg-paper py-2 text-sm text-ink outline-none focus:border-b-2 focus:border-brass";

  return (
    <>
      <AppHeader title={t("title")} backHref="/" />
      <main className="mx-auto max-w-app px-page pb-10 pt-7">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            {t("languageSection")}
          </h2>
          <div className="mt-3 rounded-card border border-line p-4">
            <label className="flex items-center justify-between gap-4 text-sm text-ink">
              <span>{t("languageLabel")}</span>
              <select
                value={locale}
                onChange={(event) =>
                  setStoredLocale(event.target.value as AppLocale)
                }
                className={selectClass}
              >
                <option value="fr">{t("french")}</option>
                <option value="en">{t("english")}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            {t("appearanceSection")}
          </h2>
          <div className="mt-3 rounded-card border border-line p-4">
            <label className="flex items-center justify-between gap-4 text-sm text-ink">
              <span>{t("themeLabel")}</span>
              <select
                value={theme}
                onChange={(event) =>
                  setStoredTheme(event.target.value as ThemePreference)
                }
                className={selectClass}
              >
                <option value="system">{t("themeSystem")}</option>
                <option value="light">{t("themeLight")}</option>
                <option value="dark">{t("themeDark")}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            Google Drive
          </h2>
          <div className="mt-3 rounded-card border border-line p-4">
            {!configured ? (
              <div>
                <p className="text-sm font-medium text-ink">
                  {t("driveNotConfigured")}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  {t("driveConfigHelp")}
                </p>
              </div>
            ) : !connected ? (
              <div>
                <p className="text-sm text-ink">{t("driveIntro")}</p>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void connect()}
                  className="mt-4 inline-flex items-center justify-center w-full gap-2 rounded-lg bg-brass px-4 py-2.5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
                >
                  <DriveIcon />
                  {busy === "connect" ? t("connecting") : t("connectDrive")}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {email ?? t("driveConnected")}
                    </p>
                    <p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.02em] text-ink-muted">
                      {t("lastBackup", {
                        date: formatDateTime(
                          sync.lastExportAt,
                          locale,
                          common("never"),
                        ),
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void disconnect()}
                    disabled={Boolean(busy)}
                    className="text-sm text-ink-muted underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                  >
                    {t("disconnect")}
                  </button>
                </div>
                {syncMessage ? (
                  <p className="mt-3 text-sm leading-5 text-ink-muted">
                    {syncMessage}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      void runDrive("export", () =>
                        exportBooksToDrive({ interactive: true }),
                      )
                    }
                    className={buttonSecondary}
                  >
                    {busy === "export" ? t("saving") : t("exportNow")}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => setImportChoice((value) => !value)}
                    className={buttonSecondary}
                  >
                    {t("importFromDrive")}
                  </button>
                </div>
                {importChoice ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-sm leading-6 text-ink-muted">
                      {t("restoreQuestion")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void importDrive("replace")}
                        className={buttonSecondary}
                      >
                        {t("replaceLocal")}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void importDrive("merge")}
                        className={buttonSecondary}
                      >
                        {t("mergeWithoutDuplicates")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {driveMessage ? (
              <p
                className="mt-4 border-t border-line pt-3 text-sm text-ink-muted"
                role="status"
              >
                {driveMessage}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            {t("localData")}
          </h2>
          <div className="mt-3 rounded-card border border-line p-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm text-ink">{t("booksSaved")}</p>
              <strong className="font-mono text-sm font-medium text-ink">
                {books.length}
              </strong>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {t("localImportHelp")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportLocal}
                disabled={Boolean(busy)}
                className={buttonSecondary}
              >
                <ExportIcon className="text-ink" />
                {t("localExport")}
              </button>
              <button
                type="button"
                onClick={() => localImportInputRef.current?.click()}
                disabled={Boolean(busy)}
                className={buttonSecondary}
              >
                <ImportIcon className="text-ink" />
                {t("localImport")}
              </button>
              <input
                ref={localImportInputRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                aria-label={t("localImport")}
                onChange={(event) => void prepareLocalImport(event)}
              />
            </div>

            {pendingLocalImport ? (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">
                  {t("localImportReady", {
                    count: pendingLocalImport.books.length,
                    file: pendingLocalImport.fileName,
                  })}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  {t("restoreQuestion")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void importLocal("replace")}
                    className={buttonSecondary}
                  >
                    {t("replaceLocal")}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void importLocal("merge")}
                    className={buttonSecondary}
                  >
                    {t("mergeWithoutDuplicates")}
                  </button>
                </div>
              </div>
            ) : null}

            {localMessage ? (
              <p
                className="mt-4 border-t border-line pt-3 text-sm text-ink-muted"
                role="status"
              >
                {localMessage}
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}

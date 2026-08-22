"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { DriveIcon, ExportIcon, ImportIcon } from "@/components/Icons";
import { useThemePreference } from "@/components/ThemeProvider";
import { useBooks } from "@/hooks/useBooks";
import {
  parseBookBackupJson,
  serializeBookBackup,
} from "@/lib/book-backup";
import {
  applyBookImport,
  type BookImportMode,
} from "@/lib/book-import";
import { formatDateTime, getTodayIso } from "@/lib/date";
import {
  exportBooksToDrive,
  getDriveLastBackupAt,
  importBooksFromDrive,
  isDriveConfigured,
} from "@/lib/drive-sync";
import type { AppLocale } from "@/lib/i18n";
import { setStoredLocale } from "@/lib/locale-store";
import {
  setStoredTheme,
  type ThemePreference,
} from "@/lib/theme-store";
import type { Book } from "@/types/book";

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
  const localImportInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string>();
  const [driveMessage, setDriveMessage] = useState<string>();
  const [localMessage, setLocalMessage] = useState<string>();
  const [driveImportChoice, setDriveImportChoice] = useState(false);
  const [lastDriveBackupAt, setLastDriveBackupAt] = useState<string>();
  const [pendingLocalImport, setPendingLocalImport] =
    useState<PendingLocalImport>();
  const configured = isDriveConfigured();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLastDriveBackupAt(getDriveLastBackupAt());
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

  const exportDrive = () =>
    runDrive("drive-export", async () => {
      const exportedAt = await exportBooksToDrive();
      setLastDriveBackupAt(exportedAt);
      setDriveMessage(t("driveExportSuccess"));
    });

  const importDrive = (mode: BookImportMode) =>
    runDrive(`drive-import-${mode}`, async () => {
      const count = await importBooksFromDrive(mode);
      setDriveImportChoice(false);
      setDriveMessage(t("importSuccess", { count }));
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

  const prepareLocalImport = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
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
          <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            <DriveIcon className="size-4" />
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
            ) : (
              <div>
                <p className="text-sm leading-6 text-ink-muted">
                  {t("driveIntro")}
                </p>
                <p className="mt-3 font-mono text-[0.72rem] uppercase tracking-[0.02em] text-ink-muted">
                  {t("lastBackup", {
                    date: formatDateTime(
                      lastDriveBackupAt,
                      locale,
                      common("never"),
                    ),
                  })}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void exportDrive()}
                    className={buttonSecondary}
                  >
                    <ExportIcon className="text-ink" />
                    {busy === "drive-export"
                      ? t("saving")
                      : t("exportToDrive")}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      setDriveImportChoice((value) => !value)
                    }
                    className={buttonSecondary}
                  >
                    <ImportIcon className="text-ink" />
                    {t("importFromDrive")}
                  </button>
                </div>
                {driveImportChoice ? (
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

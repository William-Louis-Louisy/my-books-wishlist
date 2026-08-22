"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { useBooks } from "@/hooks/useBooks";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { formatDateTime, getTodayIso } from "@/lib/date";
import { setStoredLocale } from "@/lib/locale-store";
import type { AppLocale } from "@/lib/i18n";
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  exportBooksToDrive,
  getDriveEmail,
  importBooksFromDrive,
  isDriveConfigured,
  isDriveConnected,
} from "@/lib/drive-sync";

export function SettingsScreen() {
  const t = useTranslations("Settings");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { books } = useBooks();
  const sync = useSyncStatus();
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string>();
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [importChoice, setImportChoice] = useState(false);
  const configured = isDriveConfigured();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setConnected(isDriveConnected());
      setEmail(getDriveEmail());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const run = async (name: string, action: () => Promise<void>) => {
    setBusy(name);
    setMessage(undefined);
    try {
      await action();
    } catch {
      setMessage(t("actionError"));
    } finally {
      setBusy(undefined);
    }
  };

  const connect = () => run("connect", async () => {
    await connectGoogleDrive();
    setConnected(true);
    setEmail(getDriveEmail());
  });

  const disconnect = () => run("disconnect", async () => {
    await disconnectGoogleDrive();
    setConnected(false);
    setEmail(undefined);
  });

  const exportLocal = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), books }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `book-wishlist-local-${getTodayIso()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importDrive = (mode: "replace" | "merge") => run(`import-${mode}`, async () => {
    const count = await importBooksFromDrive(mode);
    setImportChoice(false);
    setMessage(t("importSuccess", { count }));
  });

  const syncMessage =
    sync.state === "synced"
      ? t("syncSynced")
      : sync.state === "error"
        ? t("syncError")
        : sync.state === "pending"
          ? t("syncPending")
          : undefined;

  const buttonSecondary = "rounded-lg border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50 motion-reduce:transition-none";

  return (
    <>
      <AppHeader title={t("title")} backHref="/" />
      <main className="mx-auto max-w-app px-page pb-10 pt-7">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">{t("languageSection")}</h2>
          <div className="mt-3 rounded-card border border-line p-4">
            <label className="flex items-center justify-between gap-4 text-sm text-ink">
              <span>{t("languageLabel")}</span>
              <select
                value={locale}
                onChange={(event) => setStoredLocale(event.target.value as AppLocale)}
                className="border-0 border-b border-line bg-paper py-2 text-sm text-ink outline-none focus:border-b-2 focus:border-brass"
              >
                <option value="fr">{t("french")}</option>
                <option value="en">{t("english")}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">Google Drive</h2>
          <div className="mt-3 rounded-card border border-line p-4">
            {!configured ? (
              <div>
                <p className="text-sm font-medium text-ink">{t("driveNotConfigured")}</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{t("driveConfigHelp")}</p>
              </div>
            ) : !connected ? (
              <div>
                <p className="text-sm text-ink">{t("driveIntro")}</p>
                <button type="button" disabled={Boolean(busy)} onClick={() => void connect()} className="mt-4 rounded-lg bg-brass px-4 py-2.5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50">{busy === "connect" ? t("connecting") : t("connectDrive")}</button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-medium text-ink">{email ?? t("driveConnected")}</p><p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.02em] text-ink-muted">{t("lastBackup", { date: formatDateTime(sync.lastExportAt, locale, common("never")) })}</p></div>
                  <button type="button" onClick={() => void disconnect()} disabled={Boolean(busy)} className="text-sm text-ink-muted underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">{t("disconnect")}</button>
                </div>
                {syncMessage ? <p className="mt-3 text-sm leading-5 text-ink-muted">{syncMessage}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" disabled={Boolean(busy)} onClick={() => void run("export", () => exportBooksToDrive({ interactive: true }))} className={buttonSecondary}>{busy === "export" ? t("saving") : t("exportNow")}</button>
                  <button type="button" disabled={Boolean(busy)} onClick={() => setImportChoice((value) => !value)} className={buttonSecondary}>{t("importFromDrive")}</button>
                </div>
                {importChoice ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-sm leading-6 text-ink-muted">{t("restoreQuestion")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={Boolean(busy)} onClick={() => void importDrive("replace")} className={buttonSecondary}>{t("replaceLocal")}</button>
                      <button type="button" disabled={Boolean(busy)} onClick={() => void importDrive("merge")} className={buttonSecondary}>{t("mergeWithoutDuplicates")}</button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {message ? <p className="mt-4 border-t border-line pt-3 text-sm text-ink-muted" role="status">{message}</p> : null}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">{t("localData")}</h2>
          <div className="mt-3 rounded-card border border-line p-4">
            <div className="flex items-baseline justify-between gap-4"><p className="text-sm text-ink">{t("booksSaved")}</p><strong className="font-mono text-sm font-medium text-ink">{books.length}</strong></div>
            <button type="button" onClick={exportLocal} className={`${buttonSecondary} mt-5`}>{t("localExport")}</button>
          </div>
        </section>
      </main>
    </>
  );
}

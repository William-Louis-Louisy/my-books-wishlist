"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useBooks } from "@/hooks/useBooks";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { formatDateTime, getTodayIso } from "@/lib/date";
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
  const { books } = useBooks();
  const sync = useSyncStatus();
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string>();
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [importChoice, setImportChoice] = useState(false);
  const configured = isDriveConfigured();

  useEffect(() => {
    setConnected(isDriveConnected());
    setEmail(getDriveEmail());
  }, []);

  const run = async (name: string, action: () => Promise<void>) => {
    setBusy(name);
    setMessage(undefined);
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "L'action n'a pas pu aboutir.");
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
    setMessage(`${count} livre${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""} depuis Drive.`);
  });

  const buttonSecondary = "rounded-lg border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50 motion-reduce:transition-none";

  return (
    <>
      <AppHeader title="Réglages" backHref="/" />
      <main className="mx-auto max-w-app px-page pb-10 pt-7">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">Google Drive</h2>
          <div className="mt-3 rounded-card border border-line p-4">
            {!configured ? (
              <div>
                <p className="text-sm font-medium text-ink">Connexion Drive non configurée</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">Ajoutez <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> dans les variables d'environnement pour activer la sauvegarde Drive.</p>
              </div>
            ) : !connected ? (
              <div>
                <p className="text-sm text-ink">Sauvegardez cette liste dans un fichier créé par l'application sur votre Drive.</p>
                <button type="button" disabled={Boolean(busy)} onClick={() => void connect()} className="mt-4 rounded-lg bg-brass px-4 py-2.5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50">{busy === "connect" ? "Connexion…" : "Connecter Google Drive"}</button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-medium text-ink">{email ?? "Google Drive connecté"}</p><p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.02em] text-ink-muted">Dernière sauvegarde · {formatDateTime(sync.lastExportAt)}</p></div>
                  <button type="button" onClick={() => void disconnect()} disabled={Boolean(busy)} className="text-sm text-ink-muted underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">Déconnecter</button>
                </div>
                {sync.message ? <p className="mt-3 text-sm leading-5 text-ink-muted">{sync.message}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" disabled={Boolean(busy)} onClick={() => void run("export", () => exportBooksToDrive({ interactive: true }))} className={buttonSecondary}>{busy === "export" ? "Sauvegarde…" : "Exporter maintenant"}</button>
                  <button type="button" disabled={Boolean(busy)} onClick={() => setImportChoice((value) => !value)} className={buttonSecondary}>Importer depuis Drive</button>
                </div>
                {importChoice ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-sm leading-6 text-ink-muted">Comment souhaitez-vous restaurer la sauvegarde ?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={Boolean(busy)} onClick={() => void importDrive("replace")} className={buttonSecondary}>Remplacer la liste locale</button>
                      <button type="button" disabled={Boolean(busy)} onClick={() => void importDrive("merge")} className={buttonSecondary}>Fusionner sans doublons</button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {message ? <p className="mt-4 border-t border-line pt-3 text-sm text-ink-muted" role="status">{message}</p> : null}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">Données locales</h2>
          <div className="mt-3 rounded-card border border-line p-4">
            <div className="flex items-baseline justify-between gap-4"><p className="text-sm text-ink">Livres enregistrés</p><strong className="font-mono text-sm font-medium text-ink">{books.length}</strong></div>
            <button type="button" onClick={exportLocal} className={`${buttonSecondary} mt-5`}>Export JSON local</button>
          </div>
        </section>
      </main>
    </>
  );
}

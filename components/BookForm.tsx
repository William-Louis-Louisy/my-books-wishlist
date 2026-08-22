"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBook, useBooks } from "@/hooks/useBooks";
import { createBook, deleteBook, updateBook } from "@/lib/book-repository";
import { isValidIsoDate } from "@/lib/date";
import type { BookDraft, BookStatus } from "@/types/book";

interface BookFormProps {
  bookId?: string;
}

type StatusChoice = "auto" | BookStatus;

interface FormState {
  title: string;
  author: string;
  publisher: string;
  releaseDate: string;
  note: string;
  statusChoice: StatusChoice;
  purchased: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  author: "",
  publisher: "",
  releaseDate: "",
  note: "",
  statusChoice: "auto",
  purchased: false,
};

export function BookForm({ bookId }: BookFormProps) {
  const router = useRouter();
  const { book, loading } = useBook(bookId);
  const { books } = useBooks();
  const [formChanges, setFormChanges] = useState<Partial<FormState>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = Boolean(bookId);

  const baseForm: FormState = book
    ? {
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        releaseDate: book.releaseDate,
        note: book.note ?? "",
        statusChoice: book.statusOverride ?? "auto",
        purchased: book.purchased,
      }
    : EMPTY_FORM;
  const form: FormState = { ...baseForm, ...formChanges };

  const publishers = useMemo(() => [...new Set(books.map((item) => item.publisher))].sort((a, b) => a.localeCompare(b, "fr")), [books]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormChanges((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Renseignez un titre.";
    if (!form.author.trim()) next.author = "Renseignez un auteur.";
    if (!form.publisher.trim()) next.publisher = "Renseignez un éditeur.";
    if (!isValidIsoDate(form.releaseDate)) next.releaseDate = "Choisissez une date valide.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const draft: BookDraft = {
        title: form.title,
        author: form.author,
        publisher: form.publisher,
        releaseDate: form.releaseDate,
        note: form.note,
        statusOverride: form.statusChoice === "auto" ? null : form.statusChoice,
        purchased: form.purchased,
      };
      if (bookId) await updateBook(bookId, draft);
      else await createBook(draft);
      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!bookId) return;
    setSaving(true);
    try {
      await deleteBook(bookId);
      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return <><AppHeader title="Modifier le livre" backHref="/" /><main className="mx-auto max-w-app px-page py-10 text-sm text-ink-muted">Chargement…</main></>;
  }

  if (isEdit && !loading && !book) {
    return <><AppHeader title="Modifier le livre" backHref="/" /><main className="mx-auto max-w-app px-page py-10"><p className="font-display italic text-ink">Ce livre n’existe plus.</p></main></>;
  }

  const fieldClass = "w-full border-0 border-b border-line bg-transparent py-2 text-[0.9375rem] text-ink outline-none transition-[border-color,border-width] focus:border-b-2 focus:border-brass motion-reduce:transition-none";
  const labelClass = "block text-xs font-medium uppercase tracking-[0.08em] text-ink-muted";

  return (
    <>
      <AppHeader title={isEdit ? "Modifier le livre" : "Ajouter un livre"} backHref="/" />
      <main className="mx-auto max-w-app px-page pb-[max(32px,env(safe-area-inset-bottom))] pt-7">
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <label className={labelClass}>Titre
            <input autoFocus={!isEdit} value={form.title} onChange={(event) => updateField("title", event.target.value)} className={`${fieldClass} font-display text-lg`} aria-invalid={Boolean(errors.title)} />
            {errors.title ? <span className="mt-1 block text-xs text-ink-muted">{errors.title}</span> : null}
          </label>
          <label className={labelClass}>Auteur
            <input value={form.author} onChange={(event) => updateField("author", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.author)} />
            {errors.author ? <span className="mt-1 block text-xs text-ink-muted">{errors.author}</span> : null}
          </label>
          <label className={labelClass}>Éditeur
            <input list="publisher-options" value={form.publisher} onChange={(event) => updateField("publisher", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.publisher)} autoComplete="off" />
            <datalist id="publisher-options">{publishers.map((publisher) => <option key={publisher} value={publisher} />)}</datalist>
            {errors.publisher ? <span className="mt-1 block text-xs text-ink-muted">{errors.publisher}</span> : null}
          </label>
          <label className={labelClass}>Date de sortie
            <input type="date" value={form.releaseDate} onChange={(event) => updateField("releaseDate", event.target.value)} className={`${fieldClass} font-mono text-[0.8125rem] uppercase tracking-[0.02em]`} aria-invalid={Boolean(errors.releaseDate)} />
            {errors.releaseDate ? <span className="mt-1 block text-xs text-ink-muted">{errors.releaseDate}</span> : null}
          </label>
          <label className={labelClass}>Statut de sortie
            <select value={form.statusChoice} onChange={(event) => updateField("statusChoice", event.target.value as StatusChoice)} className={fieldClass}>
              <option value="auto">Automatique selon la date</option>
              <option value="upcoming">Forcer « À paraître »</option>
              <option value="available">Forcer « Disponible »</option>
            </select>
          </label>
          <label className={labelClass}>Note <span className="normal-case tracking-normal">(optionnel)</span>
            <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} rows={4} className={`${fieldClass} resize-y leading-6`} />
          </label>

          <label className="flex cursor-pointer items-center gap-3 border-y border-line py-4 text-sm text-ink">
            <input type="checkbox" checked={form.purchased} onChange={(event) => updateField("purchased", event.target.checked)} className="size-4 accent-[var(--accent-brass)]" />
            Déjà acheté
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => router.back()} className="rounded-lg px-3 py-2.5 text-sm text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">Annuler</button>
            {isEdit ? <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto rounded-lg px-3 py-2.5 text-sm text-ink-muted underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">Supprimer</button> : null}
          </div>
        </form>
      </main>
      <ConfirmDialog open={confirmDelete} title="Supprimer ce livre ?" description={book ? `« ${book.title} » sera retiré de votre liste locale.` : "Ce livre sera retiré de votre liste locale."} onCancel={() => setConfirmDelete(false)} onConfirm={() => void onDelete()} />
    </>
  );
}

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBook, useBooks } from "@/hooks/useBooks";
import { createBook, deleteBook, updateBook } from "@/lib/book-repository";
import { getBookAutocompleteOptions } from "@/lib/books";
import { isValidIsoDate } from "@/lib/date";
import type { BookDraft, BookStatus } from "@/types/book";

interface BookFormProps {
  bookId?: string;
}

type StatusChoice = "auto" | BookStatus;

interface FormState {
  title: string;
  author: string;
  series: string;
  volume: string;
  publisher: string;
  releaseDate: string;
  note: string;
  statusChoice: StatusChoice;
  purchased: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  author: "",
  series: "",
  volume: "",
  publisher: "",
  releaseDate: "",
  note: "",
  statusChoice: "auto",
  purchased: false,
};

export function BookForm({ bookId }: BookFormProps) {
  const t = useTranslations("Form");
  const common = useTranslations("Common");
  const locale = useLocale();
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
        series: book.series ?? "",
        volume: book.volume ?? "",
        publisher: book.publisher,
        releaseDate: book.releaseDate,
        note: book.note ?? "",
        statusChoice: book.statusOverride ?? "auto",
        purchased: book.purchased,
      }
    : EMPTY_FORM;
  const form: FormState = { ...baseForm, ...formChanges };

  const authorOptions = useMemo(
    () => getBookAutocompleteOptions(books, "author", locale),
    [books, locale],
  );
  const seriesOptions = useMemo(
    () => getBookAutocompleteOptions(books, "series", locale),
    [books, locale],
  );
  const publisherOptions = useMemo(
    () => getBookAutocompleteOptions(books, "publisher", locale),
    [books, locale],
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormChanges((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = t("titleRequired");
    if (!form.author.trim()) next.author = t("authorRequired");
    if (!form.publisher.trim()) next.publisher = t("publisherRequired");
    if (!isValidIsoDate(form.releaseDate)) next.releaseDate = t("dateRequired");
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
        series: form.series,
        volume: form.volume,
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
    return <><AppHeader title={t("editTitle")} backHref="/" /><main className="mx-auto max-w-app px-page py-10 text-sm text-ink-muted">{t("loading")}</main></>;
  }

  if (isEdit && !loading && !book) {
    return <><AppHeader title={t("editTitle")} backHref="/" /><main className="mx-auto max-w-app px-page py-10"><p className="font-display italic text-ink">{t("missing")}</p></main></>;
  }

  const fieldClass = "w-full border-0 border-b border-line bg-transparent py-2 text-[0.9375rem] text-ink outline-none transition-[border-color,border-width] focus:border-b-2 focus:border-brass motion-reduce:transition-none";
  const labelClass = "block text-xs font-medium uppercase tracking-[0.08em] text-ink-muted";
  const optionalLabel = <span className="normal-case tracking-normal">{common("optional")}</span>;

  return (
    <>
      <AppHeader title={isEdit ? t("editTitle") : t("addTitle")} backHref="/" />
      <main className="mx-auto max-w-app px-page pb-[max(32px,env(safe-area-inset-bottom))] pt-7">
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <label className={labelClass}>{t("title")}
            <input autoFocus={!isEdit} value={form.title} onChange={(event) => updateField("title", event.target.value)} className={`${fieldClass} font-display text-lg`} aria-invalid={Boolean(errors.title)} />
            {errors.title ? <span className="mt-1 block text-xs text-ink-muted">{errors.title}</span> : null}
          </label>
          <label className={labelClass}>{t("author")}
            <input list="author-options" value={form.author} onChange={(event) => updateField("author", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.author)} autoComplete="off" />
            <datalist id="author-options">{authorOptions.map((author) => <option key={author} value={author} />)}</datalist>
            {errors.author ? <span className="mt-1 block text-xs text-ink-muted">{errors.author}</span> : null}
          </label>
          <label className={labelClass}>{t("series")} {optionalLabel}
            <input list="series-options" value={form.series} onChange={(event) => updateField("series", event.target.value)} className={fieldClass} autoComplete="off" />
            <datalist id="series-options">{seriesOptions.map((series) => <option key={series} value={series} />)}</datalist>
          </label>
          <label className={labelClass}>{t("volume")} {optionalLabel}
            <input value={form.volume} onChange={(event) => updateField("volume", event.target.value)} className={`${fieldClass} font-mono text-[0.8125rem]`} inputMode="text" />
          </label>
          <label className={labelClass}>{t("publisher")}
            <input list="publisher-options" value={form.publisher} onChange={(event) => updateField("publisher", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.publisher)} autoComplete="off" />
            <datalist id="publisher-options">{publisherOptions.map((publisher) => <option key={publisher} value={publisher} />)}</datalist>
            {errors.publisher ? <span className="mt-1 block text-xs text-ink-muted">{errors.publisher}</span> : null}
          </label>
          <label className={labelClass}>{t("releaseDate")}
            <input type="date" value={form.releaseDate} onChange={(event) => updateField("releaseDate", event.target.value)} className={`${fieldClass} font-mono text-[0.8125rem] uppercase tracking-[0.02em]`} aria-invalid={Boolean(errors.releaseDate)} />
            {errors.releaseDate ? <span className="mt-1 block text-xs text-ink-muted">{errors.releaseDate}</span> : null}
          </label>
          <label className={labelClass}>{t("releaseStatus")}
            <select value={form.statusChoice} onChange={(event) => updateField("statusChoice", event.target.value as StatusChoice)} className={fieldClass}>
              <option value="auto">{t("automaticStatus")}</option>
              <option value="upcoming">{t("forceUpcoming")}</option>
              <option value="available">{t("forceAvailable")}</option>
            </select>
          </label>
          <label className={labelClass}>{t("note")} {optionalLabel}
            <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} rows={4} className={`${fieldClass} resize-y leading-6`} />
          </label>

          <label className="flex cursor-pointer items-center gap-3 border-y border-line py-4 text-sm text-ink">
            <input type="checkbox" checked={form.purchased} onChange={(event) => updateField("purchased", event.target.checked)} className="size-4 accent-[var(--accent-brass)]" />
            {t("alreadyPurchased")}
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50">
              {saving ? t("saving") : t("save")}
            </button>
            <button type="button" onClick={() => router.back()} className="rounded-lg px-3 py-2.5 text-sm text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">{common("cancel")}</button>
            {isEdit ? <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto rounded-lg px-3 py-2.5 text-sm text-ink-muted underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">{common("delete")}</button> : null}
          </div>
        </form>
      </main>
      <ConfirmDialog open={confirmDelete} title={t("deleteTitle")} description={book ? t("deleteDescription", { title: book.title }) : t("deleteDescriptionFallback")} onCancel={() => setConfirmDelete(false)} onConfirm={() => void onDelete()} />
    </>
  );
}

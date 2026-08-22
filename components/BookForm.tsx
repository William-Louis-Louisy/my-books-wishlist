"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBook, useBooks } from "@/hooks/useBooks";
import { createBook, deleteBook, updateBook } from "@/lib/book-repository";
import {
  getBookAutocompleteOptions,
  getBookDisplayTitle,
  hasValidBookIdentity,
} from "@/lib/books";
import {
  getReleaseDateInputValue,
  getReleaseDatePrecision,
  isValidReleaseDate,
} from "@/lib/date";
import type { BookDraft, ReleaseDatePrecision } from "@/types/book";
import { TrashIcon } from "./Icons";

interface BookFormProps {
  bookId?: string;
}

interface FormState {
  title: string;
  author: string;
  series: string;
  volume: string;
  publisher: string;
  releaseDate: string;
  releasePrecision: ReleaseDatePrecision;
  note: string;
  purchased: boolean;
}

type FormErrorKey = keyof FormState | "identity";
type FormErrors = Partial<Record<FormErrorKey, string>>;

const EMPTY_FORM: FormState = {
  title: "",
  author: "",
  series: "",
  volume: "",
  publisher: "",
  releaseDate: "",
  releasePrecision: "day",
  note: "",
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = Boolean(bookId);

  const baseForm: FormState = book
    ? {
        title: book.title ?? "",
        author: book.author ?? "",
        series: book.series ?? "",
        volume: book.volume ?? "",
        publisher: book.publisher ?? "",
        releaseDate: book.releaseDate,
        releasePrecision: getReleaseDatePrecision(book.releaseDate) ?? "day",
        note: book.note ?? "",
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

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormChanges((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current, [key]: undefined };
      if (key === "title" || key === "series" || key === "volume") {
        next.identity = undefined;
      }
      if (key === "releasePrecision") next.releaseDate = undefined;
      return next;
    });
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!hasValidBookIdentity(form)) {
      next.identity = t("identityRequired");
    }
    if (
      !isValidReleaseDate(form.releaseDate) ||
      getReleaseDatePrecision(form.releaseDate) !== form.releasePrecision
    ) {
      next.releaseDate = t("dateRequired");
    }

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
    return (
      <>
        <AppHeader title={t("editTitle")} backHref="/" />
        <main className="mx-auto max-w-app px-page py-10 text-sm text-ink-muted">
          {t("loading")}
        </main>
      </>
    );
  }

  if (isEdit && !loading && !book) {
    return (
      <>
        <AppHeader title={t("editTitle")} backHref="/" />
        <main className="mx-auto max-w-app px-page py-10">
          <p className="font-display italic text-ink">{t("missing")}</p>
        </main>
      </>
    );
  }

  const fieldClass =
    "book-form-control w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-none transition-[border-color,border-width] focus:border-b-2 focus:border-brass motion-reduce:transition-none";
  const labelClass =
    "block text-xs font-medium uppercase tracking-[0.08em] text-ink-muted";
  const optionalLabel = (
    <span className="normal-case tracking-normal">{common("optional")}</span>
  );
  const identityInvalid = Boolean(errors.identity);
  const bookDisplayTitle = book
    ? getBookDisplayTitle(book, (volume) => `${t("volume")} ${volume}`)
    : "";
  const releaseInputValue = getReleaseDateInputValue(
    form.releaseDate,
    form.releasePrecision,
  );

  return (
    <>
      <AppHeader title={isEdit ? t("editTitle") : t("addTitle")} backHref="/" />
      <main className="mx-auto max-w-app px-page pb-[max(32px,env(safe-area-inset-bottom))] pt-7">
        <form
          onSubmit={onSubmit}
          noValidate
          autoComplete="off"
          className="space-y-6"
        >
          <label className={labelClass}>
            {t("title")} {optionalLabel}
            <input
              autoFocus={!isEdit}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className={fieldClass}
              aria-invalid={identityInvalid}
            />
          </label>

          <div>
            <label htmlFor="book-author" className={labelClass}>
              {t("author")} {optionalLabel}
            </label>
            <AutocompleteInput
              id="book-author"
              value={form.author}
              options={authorOptions}
              onChange={(value) => updateField("author", value)}
              className={fieldClass}
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="words"
            />
          </div>

          <div>
            <label htmlFor="book-series" className={labelClass}>
              {t("series")} {optionalLabel}
            </label>
            <AutocompleteInput
              id="book-series"
              value={form.series}
              options={seriesOptions}
              onChange={(value) => updateField("series", value)}
              className={fieldClass}
              invalid={identityInvalid}
              autoCapitalize="words"
            />
          </div>

          <label className={labelClass}>
            {t("volume")} {optionalLabel}
            <input
              value={form.volume}
              onChange={(event) => updateField("volume", event.target.value)}
              className={fieldClass}
              inputMode="text"
              aria-invalid={identityInvalid}
            />
            {errors.identity ? (
              <span
                className="mt-1 block text-xs normal-case tracking-normal text-ink-muted"
                role="alert"
              >
                {errors.identity}
              </span>
            ) : null}
          </label>

          <div>
            <label htmlFor="book-publisher" className={labelClass}>
              {t("publisher")} {optionalLabel}
            </label>
            <AutocompleteInput
              id="book-publisher"
              value={form.publisher}
              options={publisherOptions}
              onChange={(value) => updateField("publisher", value)}
              className={fieldClass}
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="words"
            />
          </div>

          <fieldset>
            <legend className={labelClass}>{t("releaseDate")}</legend>
            <div className="mt-1 grid gap-3 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
              <label>
                <span className="sr-only">{t("datePrecision")}</span>
                <select
                  value={form.releasePrecision}
                  onChange={(event) =>
                    updateField(
                      "releasePrecision",
                      event.target.value as ReleaseDatePrecision,
                    )
                  }
                  className={fieldClass}
                >
                  <option value="day">{t("precisionDay")}</option>
                  <option value="month">{t("precisionMonth")}</option>
                  <option value="year">{t("precisionYear")}</option>
                </select>
              </label>

              {form.releasePrecision === "day" ? (
                <input
                  key="release-day"
                  type="date"
                  aria-label={t("releaseDate")}
                  defaultValue={releaseInputValue}
                  onChange={(event) =>
                    updateField("releaseDate", event.target.value)
                  }
                  className={fieldClass}
                  aria-invalid={Boolean(errors.releaseDate)}
                />
              ) : form.releasePrecision === "month" ? (
                <input
                  key="release-month"
                  type="month"
                  aria-label={t("releaseDate")}
                  defaultValue={releaseInputValue}
                  onChange={(event) =>
                    updateField("releaseDate", event.target.value)
                  }
                  className={fieldClass}
                  aria-invalid={Boolean(errors.releaseDate)}
                />
              ) : (
                <input
                  key="release-year"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder={t("yearPlaceholder")}
                  aria-label={t("releaseDate")}
                  value={releaseInputValue}
                  onChange={(event) =>
                    updateField(
                      "releaseDate",
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  className={fieldClass}
                  aria-invalid={Boolean(errors.releaseDate)}
                />
              )}
            </div>
            {errors.releaseDate ? (
              <span
                className="mt-1 block text-xs normal-case tracking-normal text-ink-muted"
                role="alert"
              >
                {errors.releaseDate}
              </span>
            ) : null}
          </fieldset>

          <label className={labelClass}>
            {t("note")} {optionalLabel}
            <textarea
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              rows={4}
              className={`${fieldClass} resize-y`}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 border-y border-line py-4 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.purchased}
              onChange={(event) =>
                updateField("purchased", event.target.checked)
              }
              className="size-4 accent-brass"
            />
            {t("alreadyPurchased")}
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            {isEdit ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg inline-flex items-center gap-2 text-action-delete px-3 py-2.5 text-sm underline decoration-action-delete underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-delete"
              >
                <TrashIcon className="size-4" />
                {common("delete")}
              </button>
            ) : null}
            <div className="flex items-center justify-end w-full gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                {common("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
              >
                {saving ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </form>
      </main>
      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteTitle")}
        description={
          book
            ? t("deleteDescription", { title: bookDisplayTitle })
            : t("deleteDescriptionFallback")
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />
    </>
  );
}

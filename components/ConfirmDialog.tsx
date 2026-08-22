"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations("Common");
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5" role="presentation" onMouseDown={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-sm rounded-card border border-line bg-paper p-5"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">{title}</h2>
        <p id="confirm-description" className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass">
            {t("cancel")}
          </button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            {confirmLabel ?? t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

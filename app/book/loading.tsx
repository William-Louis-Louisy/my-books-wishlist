"use client";

import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";

function FieldSkeleton({ short = false }: { short?: boolean }) {
  return (
    <div>
      <div
        className={`h-3 rounded-full bg-surface-muted ${short ? "w-20" : "w-28"}`}
      />
      <div className="mt-3 h-9 border-b border-line">
        <div className="h-5 w-2/3 rounded bg-surface-muted" />
      </div>
    </div>
  );
}

export default function BookFormLoading() {
  const t = useTranslations("Form");

  return (
    <>
      <AppHeader title={t("loading")} backHref="/" />
      <main
        className="mx-auto max-w-app px-page pb-[max(32px,env(safe-area-inset-bottom))] pt-7"
        aria-busy="true"
      >
        <span className="sr-only" role="status" aria-live="polite">
          {t("loading")}
        </span>

        <div
          aria-hidden="true"
          className="space-y-6 animate-pulse motion-reduce:animate-none"
        >
          <FieldSkeleton />
          <FieldSkeleton short />
          <FieldSkeleton />
          <FieldSkeleton short />
          <FieldSkeleton />

          <div>
            <div className="h-3 w-24 rounded-full bg-surface-muted" />
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
              <div className="h-9 border-b border-line">
                <div className="h-5 w-3/4 rounded bg-surface-muted" />
              </div>
              <div className="h-9 border-b border-line">
                <div className="h-5 w-1/2 rounded bg-surface-muted" />
              </div>
            </div>
          </div>

          <div>
            <div className="h-3 w-16 rounded-full bg-surface-muted" />
            <div className="mt-3 h-24 border-b border-line">
              <div className="h-5 w-5/6 rounded bg-surface-muted" />
            </div>
          </div>

          <div className="flex items-center gap-3 border-y border-line py-4">
            <div className="size-4 rounded-sm bg-surface-muted" />
            <div className="h-4 w-28 rounded bg-surface-muted" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <div className="h-10 w-20 rounded-lg bg-surface-muted" />
            <div className="h-10 w-28 rounded-lg bg-surface-muted" />
          </div>
        </div>
      </main>
    </>
  );
}

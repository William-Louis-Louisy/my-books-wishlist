"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { usePwaInstall } from "@/components/PwaInstallProvider";
import {
  getPwaInstallSnoozedUntil,
  PWA_INSTALL_SNOOZE_KEY,
  shouldOfferPwaInstall,
} from "@/lib/pwa-install";

interface InstallPromptProps {
  bookCount: number;
}

export function InstallPrompt({ bookCount }: InstallPromptProps) {
  const t = useTranslations("Install");
  const reduceMotion = useReducedMotion();
  const {
    ready,
    isIosLike,
    isStandalone,
    canPromptInstall,
    requestInstall,
  } = usePwaInstall();
  const [eligible, setEligible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setEligible(
          shouldOfferPwaInstall(localStorage.getItem(PWA_INSTALL_SNOOZE_KEY)),
        );
      } catch {
        setEligible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const snooze = () => {
    try {
      localStorage.setItem(
        PWA_INSTALL_SNOOZE_KEY,
        getPwaInstallSnoozedUntil(),
      );
    } catch {
      // The sheet can still be dismissed for the current render if storage is unavailable.
    }
    setEligible(false);
  };

  const install = async () => {
    setInstalling(true);
    try {
      const outcome = await requestInstall();
      if (outcome === "dismissed") snooze();
    } finally {
      setInstalling(false);
    }
  };

  const canOffer = canPromptInstall || isIosLike;
  const visible = ready && eligible && !isStandalone && canOffer;
  const hasLocalBooks = bookCount > 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          key="pwa-install-sheet"
          aria-labelledby="pwa-install-title"
          initial={reduceMotion ? false : { y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 360, damping: 34, mass: 0.8 }
          }
          drag={reduceMotion ? false : "y"}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.18 }}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.y > 72 || info.velocity.y > 500) snooze();
          }}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[80dvh] w-full max-w-app overflow-y-auto overscroll-contain rounded-t-[1.75rem] border-x border-t border-line bg-paper px-page pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:bottom-5 sm:rounded-[1.75rem] sm:border sm:pb-5"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-line"
          />

          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
            {t("eyebrow")}
          </p>
          <h2
            id="pwa-install-title"
            className="mt-1 font-display text-lg font-semibold text-ink"
          >
            {t(isIosLike && !canPromptInstall ? "iosTitle" : "title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {t(hasLocalBooks ? "bodyWithBooks" : "body")}
          </p>

          {isIosLike && !canPromptInstall ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink">
              <li>{t("iosStepShare")}</li>
              <li>{t("iosStepHome")}</li>
            </ol>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasLocalBooks ? (
              <Link
                href="/settings"
                className="inline-flex items-center justify-center rounded-lg border border-line bg-surface-muted px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass motion-reduce:transition-none"
              >
                {t("backupFirst")}
              </Link>
            ) : null}
            {canPromptInstall ? (
              <button
                type="button"
                disabled={installing}
                onClick={() => void install()}
                className="inline-flex items-center justify-center rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50 motion-reduce:transition-none"
              >
                {installing ? t("installing") : t("install")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={snooze}
              className="inline-flex items-center justify-center px-2 py-2 text-sm text-ink-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {t("later")}
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

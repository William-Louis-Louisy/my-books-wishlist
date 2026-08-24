"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";

interface BookmarkToggleProps {
  purchased: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function BookmarkToggle({
  purchased,
  onToggle,
  disabled,
}: BookmarkToggleProps) {
  const t = useTranslations("Bookmark");
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={purchased}
      aria-label={purchased ? t("markUnpurchased") : t("markPurchased")}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      animate={
        purchased
          ? { y: -19, rotate: -7, opacity: 0.48 }
          : { y: 0, rotate: 0, opacity: 1 }
      }
      transition={{ duration: reduceMotion ? 0.1 : 0.25, ease: "easeOut" }}
      className="bookmark-toggle absolute -top-1 right-4 z-10 h-11 w-7 origin-top bg-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-wait"
    />
  );
}

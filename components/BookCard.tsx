"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PencilIcon, TrashIcon } from "@/components/Icons";
import { deleteBook, togglePurchased } from "@/lib/book-repository";
import { formatReleaseDate } from "@/lib/date";
import { getBookDisplayTitle, resolveBookStatus } from "@/lib/books";
import {
  resolveBookCardSwipeAction,
  type BookCardSwipeAction,
} from "@/lib/swipe";
import type { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
}

const ACTION_REVEAL_WIDTH = 76;
const DRAG_LIMIT = 104;

export function BookCard({ book }: BookCardProps) {
  const t = useTranslations("BookCard");
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [openAction, setOpenAction] = useState<BookCardSwipeAction>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visualPurchased, setVisualPurchased] = useState(book.purchased);
  const status = resolveBookStatus(book);
  const hasExplicitTitle = Boolean(book.title?.trim());
  const displayTitle = getBookDisplayTitle(book, (volume) =>
    t("volume", { volume }),
  );
  const seriesMeta = hasExplicitTitle
    ? [
        book.series,
        book.volume ? t("volume", { volume: book.volume }) : undefined,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · ")
    : "";
  const secondaryMeta = [book.author, book.publisher]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  const settleCard = useCallback(
    (target: number) => {
      animate(x, target, {
        duration: reduceMotion ? 0.1 : 0.18,
        ease: "easeOut",
      });
    },
    [reduceMotion, x],
  );

  const closeActions = useCallback(() => {
    setOpenAction(null);
    settleCard(0);
  }, [settleCard]);

  useEffect(() => {
    if (openAction === null) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && cardRef.current?.contains(target)) return;
      closeActions();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeActions();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeActions, openAction]);

  const onDragEnd = (
    _: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    const action = resolveBookCardSwipeAction(info.offset.x, info.velocity.x);
    setOpenAction(action);

    if (action === "edit") {
      settleCard(ACTION_REVEAL_WIDTH);
      return;
    }

    if (action === "delete") {
      settleCard(-ACTION_REVEAL_WIDTH);
      return;
    }

    settleCard(0);
  };

  const handleToggle = async () => {
    setBusy(true);
    setVisualPurchased((value) => !value);
    try {
      await new Promise((resolve) =>
        window.setTimeout(resolve, reduceMotion ? 100 : 250),
      );
      await togglePurchased(book.id);
    } catch {
      setVisualPurchased(book.purchased);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRequest = () => {
    closeActions();
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteBook(book.id);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };

  const dateColor = visualPurchased
    ? "text-ink-muted"
    : status === "upcoming"
      ? "text-brass"
      : status === "available"
        ? "text-cloth"
        : "text-ink-muted";

  const statusBorder = visualPurchased
    ? "border-l-[3px] border-l-ink-muted/40"
    : status === "upcoming"
      ? "border-l-[3px] border-l-brass"
      : status === "available"
        ? "border-l-[3px] border-l-cloth"
        : "border-l-[3px] border-l-ink-muted/40";

  return (
    <>
      <motion.div
        ref={cardRef}
        layout
        transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: "easeOut" }}
        className="relative overflow-hidden"
      >
        <div
          className="absolute inset-0 flex"
          aria-hidden={openAction === null}
        >
          <button
            type="button"
            aria-label={t("editAria", { title: displayTitle })}
            disabled={openAction !== "edit"}
            onClick={() => router.push(`/book/${book.id}/edit`)}
            className="flex w-1/2 items-center justify-start bg-action-edit pl-6 text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white disabled:pointer-events-none"
          >
            <PencilIcon className="size-6" />
          </button>
          <button
            type="button"
            aria-label={t("deleteAria", { title: displayTitle })}
            disabled={openAction !== "delete"}
            onClick={handleDeleteRequest}
            className="flex w-1/2 items-center justify-end bg-action-delete pr-6 text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white disabled:pointer-events-none"
          >
            <TrashIcon className="size-6" />
          </button>
        </div>

        <motion.article
          drag="x"
          dragConstraints={{ left: -DRAG_LIMIT, right: DRAG_LIMIT }}
          dragElastic={0.2}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          style={{ x, touchAction: "pan-y" }}
          className={`relative border border-line px-4 py-4 pr-14 transition-[background-color] duration-200 ease-out motion-reduce:transition-none ${
            visualPurchased ? "bg-surface-muted" : "bg-paper"
          } ${statusBorder}`}
        >
          <BookmarkToggle
            purchased={visualPurchased}
            onToggle={handleToggle}
            disabled={busy}
          />
          <div
            className={`pointer-events-none relative z-1 flex items-start gap-4 transition-opacity duration-200 ease-out motion-reduce:transition-none ${visualPurchased ? "opacity-[0.55]" : "opacity-100"}`}
          >
            <div className="min-w-0 flex-1">
              <h3
                className={`font-display text-lg font-medium leading-[1.3] text-ink ${visualPurchased ? "line-through" : ""}`}
              >
                {displayTitle}
              </h3>
              {seriesMeta ? (
                <p className="mt-1 truncate text-[0.8125rem] text-ink-muted">
                  {seriesMeta}
                </p>
              ) : null}
              {secondaryMeta ? (
                <p className="mt-1 truncate text-[0.8125rem] text-ink-muted">
                  {secondaryMeta}
                </p>
              ) : null}
              {book.note ? (
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink-muted">
                  {book.note}
                </p>
              ) : null}
            </div>
            <time
              dateTime={book.releaseDate}
              className={`shrink-0 pt-0.5 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.02em] ${dateColor}`}
            >
              {formatReleaseDate(book.releaseDate, locale)}
            </time>
          </div>
        </motion.article>
      </motion.div>
      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: displayTitle })}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}

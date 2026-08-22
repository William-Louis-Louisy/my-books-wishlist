"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PencilIcon, TrashIcon } from "@/components/Icons";
import { deleteBook, togglePurchased } from "@/lib/book-repository";
import { formatReleaseDate } from "@/lib/date";
import { resolveBookStatus } from "@/lib/books";
import { resolveBookCardSwipeAction, type BookCardSwipeAction } from "@/lib/swipe";
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
  const [openAction, setOpenAction] = useState<BookCardSwipeAction>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visualPurchased, setVisualPurchased] = useState(book.purchased);
  const status = resolveBookStatus(book);
  const seriesMeta = [book.series, book.volume ? t("volume", { volume: book.volume }) : undefined]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  const settleCard = (target: number) => {
    animate(x, target, {
      duration: reduceMotion ? 0.1 : 0.18,
      ease: "easeOut",
    });
  };

  const closeActions = () => {
    setOpenAction(null);
    settleCard(0);
  };

  const onDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
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
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 100 : 250));
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
      : "text-cloth";

  return (
    <>
      <motion.div
        layout
        transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: "easeOut" }}
        className="relative overflow-hidden rounded-card"
      >
        <div className="absolute inset-0 flex" aria-hidden={openAction === null}>
          <button
            type="button"
            aria-label={t("editAria", { title: book.title })}
            disabled={openAction !== "edit"}
            onClick={() => router.push(`/book/${book.id}/edit`)}
            className="flex w-1/2 items-center justify-start bg-action-edit pl-6 text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white disabled:pointer-events-none"
          >
            <PencilIcon className="size-6" />
          </button>
          <button
            type="button"
            aria-label={t("deleteAria", { title: book.title })}
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
          } ${
            visualPurchased
              ? "border-l-[3px] border-l-ink-muted/40"
              : status === "upcoming"
                ? "border-l-[3px] border-l-brass"
                : "border-l-[3px] border-l-cloth"
          }`}
        >
          <BookmarkToggle purchased={visualPurchased} onToggle={handleToggle} disabled={busy} />
          <div className={`pointer-events-none relative z-[1] flex items-start gap-4 transition-opacity duration-200 ease-out motion-reduce:transition-none ${visualPurchased ? "opacity-[0.55]" : "opacity-100"}`}>
            <div className="min-w-0 flex-1">
              <h3 className={`font-display text-lg font-medium leading-[1.3] text-ink ${visualPurchased ? "line-through" : ""}`}>
                {book.title}
              </h3>
              {seriesMeta ? <p className="mt-1 truncate text-[0.8125rem] text-ink-muted">{seriesMeta}</p> : null}
              <p className="mt-1 truncate text-[0.8125rem] text-ink-muted">{book.author} · {book.publisher}</p>
              {book.note ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink-muted">{book.note}</p> : null}
            </div>
            <time dateTime={book.releaseDate} className={`shrink-0 pt-0.5 font-mono text-[0.8125rem] font-medium uppercase tracking-[0.02em] ${dateColor}`}>
              {formatReleaseDate(book.releaseDate, locale)}
            </time>
          </div>
        </motion.article>
      </motion.div>
      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: book.title })}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}

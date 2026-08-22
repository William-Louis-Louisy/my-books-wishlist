"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { BookmarkToggle } from "@/components/BookmarkToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteBook, togglePurchased } from "@/lib/book-repository";
import { formatReleaseDate } from "@/lib/date";
import { resolveBookStatus } from "@/lib/books";
import type { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visualPurchased, setVisualPurchased] = useState(book.purchased);
  const dragged = useRef(false);
  const status = resolveBookStatus(book);

  useEffect(() => {
    setVisualPurchased(book.purchased);
  }, [book.purchased]);

  const editBook = () => {
    if (!dragged.current) router.push(`/book/${book.id}/edit`);
  };

  const onDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    dragged.current = Math.abs(info.offset.x) > 8;
    if (info.offset.x <= -90) setConfirmDelete(true);
    if (info.offset.x >= 90) router.push(`/book/${book.id}/edit`);
    window.setTimeout(() => {
      dragged.current = false;
    }, 80);
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

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteBook(book.id);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div layout transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: "easeOut" }} className="relative overflow-hidden rounded-card">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-between bg-surface-muted px-4 text-xs uppercase tracking-[0.08em] text-ink-muted">
          <span>Modifier</span><span>Supprimer</span>
        </div>
        <motion.article
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={onDragEnd}
          whileTap={reduceMotion ? undefined : { scale: 0.995 }}
          className={`relative border border-line bg-paper px-4 py-4 pr-14 transition-[opacity,background-color] duration-200 ease-out motion-reduce:transition-none ${
            visualPurchased ? "bg-surface-muted opacity-[0.55]" : ""
          } ${
            visualPurchased
              ? "border-l-[3px] border-l-ink-muted/40"
              : status === "upcoming"
                ? "border-l-[3px] border-l-brass"
                : "border-l-[3px] border-l-cloth"
          }`}
        >
          <button
            type="button"
            aria-label={`Modifier « ${book.title} »`}
            onClick={editBook}
            className="absolute inset-0 z-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brass"
          />
          <BookmarkToggle purchased={visualPurchased} onToggle={handleToggle} disabled={busy} />
          <div className="pointer-events-none relative z-[1] flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h3 className={`font-display text-lg font-medium leading-[1.3] text-ink ${visualPurchased ? "line-through" : ""}`}>
                {book.title}
              </h3>
              <p className="mt-1 truncate text-[0.8125rem] text-ink-muted">{book.author} · {book.publisher}</p>
              {book.note ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink-muted">{book.note}</p> : null}
            </div>
            <time dateTime={book.releaseDate} className="shrink-0 pt-0.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.02em] text-ink-muted">
              {formatReleaseDate(book.releaseDate)}
            </time>
          </div>
        </motion.article>
      </motion.div>
      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce livre ?"
        description={`« ${book.title} » sera retiré de votre liste locale.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}

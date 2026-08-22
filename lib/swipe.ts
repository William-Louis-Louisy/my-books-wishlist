export type BookCardSwipeAction = "edit" | "delete" | null;

export const BOOK_CARD_SWIPE_THRESHOLD = 72;

export function resolveBookCardSwipeAction(offsetX: number): BookCardSwipeAction {
  if (offsetX <= -BOOK_CARD_SWIPE_THRESHOLD) return "delete";
  if (offsetX >= BOOK_CARD_SWIPE_THRESHOLD) return "edit";
  return null;
}

export type BookCardSwipeAction = "edit" | "delete" | null;

export const BOOK_CARD_SWIPE_THRESHOLD = 32;
export const BOOK_CARD_SWIPE_FLICK_MIN_OFFSET = 14;
export const BOOK_CARD_SWIPE_FLICK_VELOCITY = 420;

export function resolveBookCardSwipeAction(
  offsetX: number,
  velocityX = 0,
): BookCardSwipeAction {
  if (offsetX <= -BOOK_CARD_SWIPE_THRESHOLD) return "delete";
  if (offsetX >= BOOK_CARD_SWIPE_THRESHOLD) return "edit";

  if (
    offsetX <= -BOOK_CARD_SWIPE_FLICK_MIN_OFFSET &&
    velocityX <= -BOOK_CARD_SWIPE_FLICK_VELOCITY
  ) {
    return "delete";
  }

  if (
    offsetX >= BOOK_CARD_SWIPE_FLICK_MIN_OFFSET &&
    velocityX >= BOOK_CARD_SWIPE_FLICK_VELOCITY
  ) {
    return "edit";
  }

  return null;
}

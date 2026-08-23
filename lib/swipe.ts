export type BookCardSwipeAction = "edit" | "delete" | null;

export type BookCardSwipeResolution =
  | { mode: "close"; action: null }
  | { mode: "reveal" | "trigger"; action: Exclude<BookCardSwipeAction, null> };

export const BOOK_CARD_SWIPE_REVEAL_THRESHOLD = 32;
export const BOOK_CARD_SWIPE_TRIGGER_THRESHOLD = 96;
export const BOOK_CARD_SWIPE_THRESHOLD = BOOK_CARD_SWIPE_REVEAL_THRESHOLD;
export const BOOK_CARD_SWIPE_FLICK_MIN_OFFSET = 14;
export const BOOK_CARD_SWIPE_FLICK_VELOCITY = 420;

export function resolveBookCardSwipeRelease(
  positionX: number,
  velocityX = 0,
): BookCardSwipeResolution {
  if (positionX <= -BOOK_CARD_SWIPE_TRIGGER_THRESHOLD) {
    return { mode: "trigger", action: "delete" };
  }

  if (positionX >= BOOK_CARD_SWIPE_TRIGGER_THRESHOLD) {
    return { mode: "trigger", action: "edit" };
  }

  if (positionX <= -BOOK_CARD_SWIPE_REVEAL_THRESHOLD) {
    return { mode: "reveal", action: "delete" };
  }

  if (positionX >= BOOK_CARD_SWIPE_REVEAL_THRESHOLD) {
    return { mode: "reveal", action: "edit" };
  }

  if (
    positionX <= -BOOK_CARD_SWIPE_FLICK_MIN_OFFSET &&
    velocityX <= -BOOK_CARD_SWIPE_FLICK_VELOCITY
  ) {
    return { mode: "reveal", action: "delete" };
  }

  if (
    positionX >= BOOK_CARD_SWIPE_FLICK_MIN_OFFSET &&
    velocityX >= BOOK_CARD_SWIPE_FLICK_VELOCITY
  ) {
    return { mode: "reveal", action: "edit" };
  }

  return { mode: "close", action: null };
}

export function resolveBookCardSwipeAction(
  positionX: number,
  velocityX = 0,
): BookCardSwipeAction {
  return resolveBookCardSwipeRelease(positionX, velocityX).action;
}

import { describe, expect, it } from "vitest";
import {
  BOOK_CARD_SWIPE_FLICK_MIN_OFFSET,
  BOOK_CARD_SWIPE_FLICK_VELOCITY,
  BOOK_CARD_SWIPE_THRESHOLD,
  resolveBookCardSwipeAction,
} from "@/lib/swipe";

describe("book card swipe gestures", () => {
  it("maps a deliberate left drag to deletion", () => {
    expect(resolveBookCardSwipeAction(-BOOK_CARD_SWIPE_THRESHOLD)).toBe("delete");
    expect(resolveBookCardSwipeAction(-80)).toBe("delete");
  });

  it("maps a deliberate right drag to edition", () => {
    expect(resolveBookCardSwipeAction(BOOK_CARD_SWIPE_THRESHOLD)).toBe("edit");
    expect(resolveBookCardSwipeAction(80)).toBe("edit");
  });

  it("accepts a short but fast mobile flick", () => {
    expect(
      resolveBookCardSwipeAction(
        -BOOK_CARD_SWIPE_FLICK_MIN_OFFSET,
        -BOOK_CARD_SWIPE_FLICK_VELOCITY,
      ),
    ).toBe("delete");
    expect(
      resolveBookCardSwipeAction(
        BOOK_CARD_SWIPE_FLICK_MIN_OFFSET,
        BOOK_CARD_SWIPE_FLICK_VELOCITY,
      ),
    ).toBe("edit");
  });

  it("does not reveal an action for a small slow movement", () => {
    expect(resolveBookCardSwipeAction(-10, -100)).toBeNull();
    expect(resolveBookCardSwipeAction(0, 0)).toBeNull();
    expect(resolveBookCardSwipeAction(10, 100)).toBeNull();
  });
});

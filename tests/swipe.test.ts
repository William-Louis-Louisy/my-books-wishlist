import { describe, expect, it } from "vitest";
import { BOOK_CARD_SWIPE_THRESHOLD, resolveBookCardSwipeAction } from "@/lib/swipe";

describe("book card swipe gestures", () => {
  it("maps a left swipe to deletion", () => {
    expect(resolveBookCardSwipeAction(-BOOK_CARD_SWIPE_THRESHOLD)).toBe("delete");
    expect(resolveBookCardSwipeAction(-120)).toBe("delete");
  });

  it("maps a right swipe to edition", () => {
    expect(resolveBookCardSwipeAction(BOOK_CARD_SWIPE_THRESHOLD)).toBe("edit");
    expect(resolveBookCardSwipeAction(120)).toBe("edit");
  });

  it("does not trigger an action below the threshold", () => {
    expect(resolveBookCardSwipeAction(-BOOK_CARD_SWIPE_THRESHOLD + 1)).toBeNull();
    expect(resolveBookCardSwipeAction(0)).toBeNull();
    expect(resolveBookCardSwipeAction(BOOK_CARD_SWIPE_THRESHOLD - 1)).toBeNull();
  });
});

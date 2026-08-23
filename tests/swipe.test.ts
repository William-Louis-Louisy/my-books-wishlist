import { describe, expect, it } from "vitest";
import {
  BOOK_CARD_SWIPE_FLICK_MIN_OFFSET,
  BOOK_CARD_SWIPE_FLICK_VELOCITY,
  BOOK_CARD_SWIPE_REVEAL_THRESHOLD,
  BOOK_CARD_SWIPE_TRIGGER_THRESHOLD,
  resolveBookCardSwipeAction,
  resolveBookCardSwipeRelease,
} from "@/lib/swipe";

describe("book card swipe gestures", () => {
  it("reveals deletion for a deliberate left drag", () => {
    expect(
      resolveBookCardSwipeRelease(-BOOK_CARD_SWIPE_REVEAL_THRESHOLD),
    ).toEqual({ mode: "reveal", action: "delete" });
    expect(resolveBookCardSwipeAction(-80)).toBe("delete");
  });

  it("reveals edition for a deliberate right drag", () => {
    expect(
      resolveBookCardSwipeRelease(BOOK_CARD_SWIPE_REVEAL_THRESHOLD),
    ).toEqual({ mode: "reveal", action: "edit" });
    expect(resolveBookCardSwipeAction(80)).toBe("edit");
  });

  it("triggers the action only near the drag limit", () => {
    expect(
      resolveBookCardSwipeRelease(-BOOK_CARD_SWIPE_TRIGGER_THRESHOLD),
    ).toEqual({ mode: "trigger", action: "delete" });
    expect(
      resolveBookCardSwipeRelease(BOOK_CARD_SWIPE_TRIGGER_THRESHOLD),
    ).toEqual({ mode: "trigger", action: "edit" });
  });

  it("accepts a short but fast mobile flick as a reveal only", () => {
    expect(
      resolveBookCardSwipeRelease(
        -BOOK_CARD_SWIPE_FLICK_MIN_OFFSET,
        -BOOK_CARD_SWIPE_FLICK_VELOCITY,
      ),
    ).toEqual({ mode: "reveal", action: "delete" });
    expect(
      resolveBookCardSwipeRelease(
        BOOK_CARD_SWIPE_FLICK_MIN_OFFSET,
        BOOK_CARD_SWIPE_FLICK_VELOCITY,
      ),
    ).toEqual({ mode: "reveal", action: "edit" });
  });

  it("closes when a revealed card is dragged back near the center", () => {
    expect(resolveBookCardSwipeRelease(20, -600)).toEqual({
      mode: "close",
      action: null,
    });
    expect(resolveBookCardSwipeRelease(-20, 600)).toEqual({
      mode: "close",
      action: null,
    });
  });

  it("does not reveal an action for a small slow movement", () => {
    expect(resolveBookCardSwipeRelease(-10, -100)).toEqual({
      mode: "close",
      action: null,
    });
    expect(resolveBookCardSwipeRelease(0, 0)).toEqual({
      mode: "close",
      action: null,
    });
    expect(resolveBookCardSwipeRelease(10, 100)).toEqual({
      mode: "close",
      action: null,
    });
  });
});

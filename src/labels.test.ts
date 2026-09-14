import { describe, expect, it } from "vitest";
import {
  computeLabelBudget,
  estimateLabelBox,
  orderByPriority,
  rejectOverlappingLabels,
  selectVisibleLabels,
  type LabelCandidate,
  type PositionedLabelCandidate,
} from "./labels";

function candidate(overrides: Partial<LabelCandidate> & { id: string }): LabelCandidate {
  return {
    label: overrides.id,
    isFocus: false,
    isNeighbor: false,
    isSearchMatch: false,
    weight: 0,
    ...overrides,
  };
}

function positioned(
  overrides: Partial<PositionedLabelCandidate> & { id: string },
): PositionedLabelCandidate {
  return {
    ...candidate(overrides),
    centerX: 0,
    centerY: 0,
    ...overrides,
  };
}

describe("estimateLabelBox", () => {
  it("scales width with label length and height with font size", () => {
    const short = estimateLabelBox("hi");
    const long = estimateLabelBox("a much longer label string");
    expect(long.width).toBeGreaterThan(short.width);
    expect(short.height).toBe(long.height);
  });

  it("grows with font size", () => {
    const small = estimateLabelBox("label", 11);
    const large = estimateLabelBox("label", 22);
    expect(large.width).toBeGreaterThan(small.width);
    expect(large.height).toBeGreaterThan(small.height);
  });

  it("never returns a zero-area box, even for an empty label", () => {
    const box = estimateLabelBox("");
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});

describe("computeLabelBudget", () => {
  it("derives a budget from viewport area over average box area", () => {
    expect(computeLabelBudget(1000, 100, 100)).toBe(1000);
  });

  it("returns 0 for a non-positive average box area", () => {
    expect(computeLabelBudget(1000, 100, 0)).toBe(0);
    expect(computeLabelBudget(1000, 100, -5)).toBe(0);
  });

  it("never returns a negative budget", () => {
    expect(computeLabelBudget(10, 10, 1_000_000)).toBe(0);
  });
});

describe("selectVisibleLabels", () => {
  it("returns an empty set for no candidates", () => {
    expect(selectVisibleLabels([], 1000, 1000).size).toBe(0);
  });

  it("admits every candidate when the budget comfortably covers them", () => {
    const candidates = Array.from({ length: 20 }, (_, i) => candidate({ id: `n${i}`, label: "hi" }));
    const admitted = selectVisibleLabels(candidates, 1100, 780);
    expect(admitted.size).toBe(candidates.length);
  });

  it("thins to a budget smaller than the candidate count", () => {
    const longLabel = "X".repeat(80);
    const candidates = Array.from({ length: 50 }, (_, i) => candidate({ id: `n${i}`, label: longLabel }));
    const admitted = selectVisibleLabels(candidates, 300, 200);
    expect(admitted.size).toBeGreaterThan(0);
    expect(admitted.size).toBeLessThan(candidates.length);
  });

  it("always admits focus and neighbors even when the budget is 0", () => {
    const longLabel = "X".repeat(500);
    const candidates = [
      candidate({ id: "focus", label: longLabel, isFocus: true }),
      candidate({ id: "neighbor", label: longLabel, isNeighbor: true }),
      candidate({ id: "stranger", label: longLabel }),
    ];
    // A 1x1 viewport against a huge label forces the computed budget to 0.
    const admitted = selectVisibleLabels(candidates, 1, 1);
    expect(admitted.has("focus")).toBe(true);
    expect(admitted.has("neighbor")).toBe(true);
    expect(admitted.has("stranger")).toBe(false);
  });

  it("counts admitted neighbors against the budget instead of adding on top of it", () => {
    // Regression guard: a focused node with many neighbors must not let the
    // total admitted count exceed the viewport budget — neighbors are
    // exempt from *rejection*, not from *budget accounting*.
    const longLabel = "X".repeat(80);
    const neighbors = Array.from({ length: 8 }, (_, i) =>
      candidate({ id: `neighbor-${i}`, label: longLabel, isNeighbor: true }),
    );
    const plain = Array.from({ length: 30 }, (_, i) => candidate({ id: `plain-${i}`, label: longLabel }));
    const box = estimateLabelBox(longLabel);
    // Viewport area = 10.5x a single box's area gives a budget of exactly
    // 10 (floor(10.5) === 10), with margin either side of the
    // floating-point-exact boundary.
    const admitted = selectVisibleLabels([...neighbors, ...plain], box.width * 10.5, box.height);
    expect(admitted.size).toBe(10);
    neighbors.forEach((n) => expect(admitted.has(n.id)).toBe(true));
  });

  // A viewport of 1.2x a single box's area gives a budget of exactly 1
  // (floor(1.2) === 1) with margin either side of the floating-point-exact
  // boundary, so these tie-break tests aren't sensitive to rounding.
  function budgetForOneOf(label: string): { width: number; height: number } {
    const box = estimateLabelBox(label);
    return { width: box.width * 1.2, height: box.height };
  }

  it("ranks search matches above equal-weight non-matches under a tight budget", () => {
    const longLabel = "X".repeat(80);
    const candidates = [
      candidate({ id: "match", label: longLabel, isSearchMatch: true }),
      candidate({ id: "plain-a", label: longLabel }),
      candidate({ id: "plain-b", label: longLabel }),
    ];
    const { width, height } = budgetForOneOf(longLabel);
    const admitted = selectVisibleLabels(candidates, width, height);
    expect(admitted.size).toBe(1);
    expect(admitted.has("match")).toBe(true);
  });

  it("ranks higher weight above lower weight when search match is tied", () => {
    const longLabel = "X".repeat(80);
    const candidates = [
      candidate({ id: "heavy", label: longLabel, weight: 10 }),
      candidate({ id: "light", label: longLabel, weight: 1 }),
    ];
    const { width, height } = budgetForOneOf(longLabel);
    const admitted = selectVisibleLabels(candidates, width, height);
    expect(admitted.size).toBe(1);
    expect(admitted.has("heavy")).toBe(true);
  });

  it("breaks ties by input order, so near-first candidates win", () => {
    const longLabel = "X".repeat(80);
    const candidates = [
      candidate({ id: "near", label: longLabel }),
      candidate({ id: "far", label: longLabel }),
    ];
    const { width, height } = budgetForOneOf(longLabel);
    const admitted = selectVisibleLabels(candidates, width, height);
    expect(admitted.size).toBe(1);
    expect(admitted.has("near")).toBe(true);
  });
});

describe("orderByPriority", () => {
  it("orders focus > neighbor > search match > plain", () => {
    const ordered = orderByPriority([
      candidate({ id: "plain" }),
      candidate({ id: "match", isSearchMatch: true }),
      candidate({ id: "neighbor", isNeighbor: true }),
      candidate({ id: "focus", isFocus: true }),
    ]);
    expect(ordered.map((c) => c.id)).toEqual(["focus", "neighbor", "match", "plain"]);
  });

  it("preserves the concrete candidate type (e.g. positioned candidates)", () => {
    const ordered = orderByPriority([positioned({ id: "a", centerX: 5, centerY: 6 })]);
    expect(ordered[0]?.centerX).toBe(5);
    expect(ordered[0]?.centerY).toBe(6);
  });
});

describe("rejectOverlappingLabels", () => {
  it("returns an empty set for no candidates", () => {
    expect(rejectOverlappingLabels([]).size).toBe(0);
  });

  it("keeps non-overlapping candidates", () => {
    const far = 10_000;
    const candidates = [
      positioned({ id: "a", label: "alpha", centerX: 0, centerY: 0 }),
      positioned({ id: "b", label: "beta", centerX: far, centerY: far }),
    ];
    const admitted = rejectOverlappingLabels(candidates);
    expect(admitted.has("a")).toBe(true);
    expect(admitted.has("b")).toBe(true);
  });

  it("rejects a lower-priority candidate whose box overlaps a higher-priority one", () => {
    const candidates = [
      positioned({ id: "loser", label: "hello", centerX: 1, centerY: 1, weight: 0 }),
      positioned({ id: "winner", label: "hello", centerX: 0, centerY: 0, weight: 10 }),
    ];
    const admitted = rejectOverlappingLabels(candidates);
    expect(admitted.has("winner")).toBe(true);
    expect(admitted.has("loser")).toBe(false);
  });

  it("always admits focus and neighbors even when they overlap a higher-priority box", () => {
    // Two neighbors stacked exactly on top of each other, and nothing else.
    const candidates = [
      positioned({ id: "neighbor-a", label: "hello world", isNeighbor: true, centerX: 0, centerY: 0 }),
      positioned({ id: "neighbor-b", label: "hello world", isNeighbor: true, centerX: 0, centerY: 0 }),
    ];
    const admitted = rejectOverlappingLabels(candidates);
    expect(admitted.has("neighbor-a")).toBe(true);
    expect(admitted.has("neighbor-b")).toBe(true);
  });

  it("still rejects overlapping non-exempt candidates near an exempt one", () => {
    const candidates = [
      positioned({ id: "focus", label: "hello world", isFocus: true, centerX: 0, centerY: 0 }),
      positioned({ id: "stranger", label: "hello world", centerX: 0, centerY: 0 }),
    ];
    const admitted = rejectOverlappingLabels(candidates);
    expect(admitted.has("focus")).toBe(true);
    expect(admitted.has("stranger")).toBe(false);
  });
});

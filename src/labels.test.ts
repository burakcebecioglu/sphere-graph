import { describe, expect, it } from "vitest";
import { computeLabelBudget, estimateLabelBox, selectVisibleLabels, type LabelCandidate } from "./labels";

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

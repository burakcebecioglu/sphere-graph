import { describe, expect, it } from "vitest";
import { matchScore, searchMatchIds, searchNodes } from "./search";
import type { SphereGraphNode } from "./types";

const nodes: SphereGraphNode[] = [
  { id: "a", label: "Alpha", description: "First node", tags: ["theory"] },
  { id: "b", label: "Beta", group: "ch2" },
  { id: "c", label: "Gamma", tags: ["empirics"] },
];

describe("matchScore", () => {
  it("returns 0 for empty query", () => {
    expect(matchScore(nodes[0]!, "")).toBe(0);
  });

  it("scores label matches highest", () => {
    expect(matchScore(nodes[0]!, "alpha")).toBe(1);
  });

  it("scores description and tags", () => {
    expect(matchScore(nodes[0]!, "first")).toBe(0.85);
    expect(matchScore(nodes[2]!, "empirics")).toBe(0.75);
  });
});

describe("searchNodes", () => {
  it("returns all nodes for empty query", () => {
    expect(searchNodes(nodes, "")).toHaveLength(3);
  });

  it("filters and sorts matches", () => {
    const results = searchNodes(nodes, "alpha");
    expect(results.map((n) => n.id)).toEqual(["a"]);
  });
});

describe("searchMatchIds", () => {
  it("returns empty set for blank query", () => {
    expect(searchMatchIds(nodes, "   ").size).toBe(0);
  });

  it("returns ids of matches", () => {
    expect(searchMatchIds(nodes, "gamma")).toEqual(new Set(["c"]));
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SphereGraph } from "./SphereGraph";
import type { SphereGraphEdge, SphereGraphNode } from "./types";

const nodes: SphereGraphNode[] = [
  { id: "a", label: "Alpha", group: "g1", description: "First node" },
  { id: "b", label: "Beta", group: "g2" },
  { id: "c", label: "Gamma", group: "g1" },
];

const edges: SphereGraphEdge[] = [
  { source: "a", target: "b", kind: "sequential", directed: true },
  { source: "b", target: "c", kind: "reference", directed: true },
];

afterEach(() => {
  cleanup();
});

describe("SphereGraph", () => {
  it("renders empty state", () => {
    render(<SphereGraph nodes={[]} edges={[]} />);
    expect(screen.getByText("No nodes to display.")).toBeTruthy();
  });

  it("shows search bar when enabled", () => {
    render(<SphereGraph nodes={nodes} edges={edges} showSearchBar />);
    expect(screen.getByLabelText("Search nodes")).toBeTruthy();
  });

  it("reports search matches to host", () => {
    const onSearchMatchesChange = vi.fn();
    render(
      <SphereGraph
        nodes={nodes}
        edges={edges}
        searchQuery="gamma"
        onSearchMatchesChange={onSearchMatchesChange}
      />,
    );
    expect(onSearchMatchesChange).toHaveBeenCalledWith([expect.objectContaining({ id: "c" })]);
  });

  it("hides nodes outside visibleGroups", () => {
    render(<SphereGraph nodes={nodes} edges={edges} visibleGroups={["g1"]} />);
    expect(screen.queryByRole("button", { name: /Beta/i })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Alpha/i }).length).toBeGreaterThan(0);
  });

  it("calls onNodeActivate on double-click", async () => {
    const user = userEvent.setup();
    const onNodeActivate = vi.fn();
    const { container } = render(
      <SphereGraph nodes={nodes} edges={edges} onNodeActivate={onNodeActivate} />,
    );
    const viewer = container.querySelector(".sphere-graph")!;
    const btn = within(viewer as HTMLElement).getAllByRole("button", { name: /Alpha/i })[0]!;
    await user.dblClick(btn);
    expect(onNodeActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  it("pins node on click and shows focus edges", async () => {
    const user = userEvent.setup();
    const onPinnedIdChange = vi.fn();
    const { container } = render(
      <SphereGraph nodes={nodes} edges={edges} onPinnedIdChange={onPinnedIdChange} />,
    );
    const viewer = container.querySelector(".sphere-graph")!;
    const btn = within(viewer as HTMLElement).getAllByRole("button", { name: /Alpha/i })[0]!;
    await user.click(btn);
    expect(onPinnedIdChange).toHaveBeenCalledWith("a");
    expect(container.querySelector(".sphere-graph__edge")).toBeTruthy();
  });

  it("respects initialPinnedId", () => {
    render(
      <SphereGraph
        nodes={nodes}
        edges={edges}
        initialPinnedId="a"
        renderDetail={(focus) => (focus ? <span>Focused: {focus.node.label}</span> : null)}
      />,
    );
    expect(screen.getByText("Focused: Alpha")).toBeTruthy();
  });

  it("jumps to first search match", () => {
    const onPinnedIdChange = vi.fn();
    render(
      <SphereGraph
        nodes={nodes}
        edges={edges}
        searchQuery="alpha"
        onPinnedIdChange={onPinnedIdChange}
      />,
    );
    expect(onPinnedIdChange).toHaveBeenCalledWith("a");
  });

  it("cycles neighbors with arrow keys", async () => {
    const user = userEvent.setup();
    const onPinnedIdChange = vi.fn();
    const { container } = render(
      <SphereGraph
        nodes={nodes}
        edges={edges}
        pinnedId="a"
        onPinnedIdChange={onPinnedIdChange}
      />,
    );
    const viewer = container.querySelector(".sphere-graph") as HTMLElement;
    viewer.focus();
    await user.keyboard("{ArrowRight}");
    expect(onPinnedIdChange).toHaveBeenCalledWith("b");
  });

  it("activates focused node on Enter", async () => {
    const user = userEvent.setup();
    const onNodeActivate = vi.fn();
    const { container } = render(
      <SphereGraph
        nodes={nodes}
        edges={edges}
        initialPinnedId="a"
        onNodeActivate={onNodeActivate}
      />,
    );
    const viewer = container.querySelector(".sphere-graph") as HTMLElement;
    viewer.focus();
    await user.keyboard("{Enter}");
    expect(onNodeActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  describe("label LOD (SG-9 fix + SG-10 screen-space budget)", () => {
    const manyNodes: SphereGraphNode[] = Array.from({ length: 90 }, (_, i) => ({
      id: `n${i}`,
      label: `Node ${i}`,
      group: "g1",
    }));

    it("keeps most labels visible when they comfortably fit the budget, regardless of node count", () => {
      // Regression guard for SG-9: node count alone must not gate labels —
      // 90 short labels easily fit the default viewport's budget. Some are
      // still rejected by SG-11's collision pass where they genuinely
      // overlap on screen (70/90 for this exact fixture), so this isn't a
      // hard 100% — but the upper bound proves collision rejection is
      // actually active (a no-op regression would hit 90), not just present.
      const { container } = render(<SphereGraph nodes={manyNodes} edges={[]} />);
      const labels = container.querySelectorAll(".sphere-graph__label");
      expect(labels.length).toBeGreaterThan(60);
      expect(labels.length).toBeLessThan(manyNodes.length);
    });

    it("thins labels to a viewport-derived budget when they don't fit, regardless of node count", () => {
      // Regression guard for SG-10: this is the actual "text mat" bug —
      // many long labels in a small viewport must thin, not the old
      // fixed-80-node threshold.
      const longLabel = "X".repeat(70);
      const wideNodes: SphereGraphNode[] = Array.from({ length: 50 }, (_, i) => ({
        id: `w${i}`,
        label: longLabel,
        group: "g1",
      }));
      const { container } = render(
        <SphereGraph nodes={wideNodes} edges={[]} width={300} height={200} />,
      );
      const labels = container.querySelectorAll(".sphere-graph__label");
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.length).toBeLessThan(wideNodes.length);
    });

    it("still shows the focused node's label regardless of budget", () => {
      const { container } = render(
        <SphereGraph nodes={manyNodes} edges={[]} initialPinnedId="n0" />,
      );
      const labels = container.querySelectorAll(".sphere-graph__label");
      expect(labels.length).toBe(1);
      expect(labels[0]?.textContent).toBe("Node 0");
    });

    it("shows every label for a small graph", () => {
      const { container } = render(<SphereGraph nodes={nodes} edges={edges} />);
      const labels = container.querySelectorAll(".sphere-graph__label");
      expect(labels.length).toBe(nodes.length);
    });

    it("still shows the focused node's neighbor labels regardless of budget", () => {
      const manyEdges: SphereGraphEdge[] = [{ source: "n0", target: "n1", kind: "reference" }];
      const { container } = render(
        <SphereGraph nodes={manyNodes} edges={manyEdges} initialPinnedId="n0" />,
      );
      const labels = Array.from(container.querySelectorAll(".sphere-graph__label")).map(
        (el) => el.textContent,
      );
      expect(labels.sort()).toEqual(["Node 0", "Node 1"]);
    });

    it("hides non-neighbor labels even with a focus set", () => {
      const manyEdges: SphereGraphEdge[] = [{ source: "n0", target: "n1", kind: "reference" }];
      const { container } = render(
        <SphereGraph nodes={manyNodes} edges={manyEdges} initialPinnedId="n0" />,
      );
      const labelTexts = Array.from(container.querySelectorAll(".sphere-graph__label")).map(
        (el) => el.textContent,
      );
      expect(labelTexts).not.toContain("Node 2");
    });

    it("SG-15 regression: renders far fewer than 150 labels for 150 realistic sentence-length nodes", () => {
      // End-to-end: at this scale, with real-world label lengths (not
      // "N7"), every label rendering unconditionally is exactly the
      // unreadable text mat the whole SG-9/SG-10/SG-11 chain exists to fix.
      // This exercises budget + collision together; labels.test.ts has a
      // budget-only version of this same scale, isolated from collision,
      // since the two stages land in a similar range here and could
      // otherwise mask a regression in either one alone.
      const denseNodes: SphereGraphNode[] = Array.from({ length: 150 }, (_, i) => ({
        id: `dense-${i}`,
        label: `A fairly long, realistic sentence-length label for node number ${i}`,
        group: `g${i % 5}`,
      }));
      const { container } = render(<SphereGraph nodes={denseNodes} edges={[]} />);
      const labels = container.querySelectorAll(".sphere-graph__label");
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.length).toBeLessThan(75);
    });
  });
});

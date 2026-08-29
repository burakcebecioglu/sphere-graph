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
});

import { describe, expect, it } from "vitest";
import { project } from "./project";
import type { Camera } from "./types";

const camera: Camera = {
  yaw: 0,
  pitch: 0,
  distance: 3.2,
  width: 1100,
  height: 780,
  focal: 800,
};

describe("project", () => {
  it("returns an empty array for empty input", () => {
    expect(project([], camera)).toEqual([]);
  });

  it("sorts projected nodes far-to-near by depth", () => {
    const nodes = [
      { id: "farther", x: 0, y: 0, z: 1 },
      { id: "closer", x: 0, y: 0, z: 0.2 },
    ];
    const projected = project(nodes, camera);
    expect(projected.map((node) => node.id)).toEqual(["farther", "closer"]);
    expect(projected[0]!.depth).toBeGreaterThan(projected[1]!.depth);
  });

  it("drops points behind the camera", () => {
    const projected = project([{ id: "behind", x: 0, y: 0, z: -5 }], camera);
    expect(projected).toEqual([]);
  });

  it("projects a front-facing point near the viewport center", () => {
    const node = { id: "center", x: 0, y: 0, z: 1 };
    const [projected] = project([node], camera);
    expect(projected!.x).toBeCloseTo(camera.width / 2, 5);
    expect(projected!.y).toBeCloseTo(camera.height / 2, 5);
  });

  it("preserves the source node reference on each result", () => {
    const node = { id: "a", x: 0.5, y: 0.2, z: 0.8 };
    const [projected] = project([node], camera);
    expect(projected!.source).toBe(node);
  });
});

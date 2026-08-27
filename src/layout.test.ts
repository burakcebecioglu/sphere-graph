import { describe, expect, it } from "vitest";
import { fibonacciSphere, fibonacciWedge, layoutOnSphere } from "./layout";
import type { Point3D } from "./types";

function expectOnUnitSphere({ x, y, z }: Point3D) {
  expect(x * x + y * y + z * z).toBeCloseTo(1, 5);
}

function longitude({ x, z }: Point3D): number {
  const theta = Math.atan2(z, x);
  return theta < 0 ? theta + Math.PI * 2 : theta;
}

describe("fibonacciSphere", () => {
  it("returns an empty array for n=0", () => {
    expect(fibonacciSphere(0)).toEqual([]);
  });

  it("returns one point on the unit sphere for n=1", () => {
    const [point] = fibonacciSphere(1);
    expect(point).toEqual({ x: 1, y: 0, z: 0 });
    expectOnUnitSphere(point!);
  });

  it("returns n points on the unit sphere for n=20", () => {
    const points = fibonacciSphere(20);
    expect(points).toHaveLength(20);
    for (const point of points) {
      expectOnUnitSphere(point);
    }
  });
});

describe("fibonacciWedge", () => {
  it("returns an empty array for n=0", () => {
    expect(fibonacciWedge(0, 0, Math.PI)).toEqual([]);
  });

  it("returns n points on the unit sphere for n=5", () => {
    const points = fibonacciWedge(5, 0, Math.PI / 2);
    expect(points).toHaveLength(5);
    for (const point of points) {
      expectOnUnitSphere(point);
    }
  });

  it("keeps longitudes within the wedge band", () => {
    const start = Math.PI / 4;
    const width = Math.PI / 2;
    const points = fibonacciWedge(12, start, width);
    for (const point of points) {
      const r2 = point.x * point.x + point.z * point.z;
      if (r2 < 1e-4) continue;
      const theta = longitude(point);
      expect(theta).toBeGreaterThanOrEqual(start - 1e-10);
      expect(theta).toBeLessThan(start + width);
    }
  });
});

describe("layoutOnSphere", () => {
  it("preserves node fields and returns the same count", () => {
    const nodes = [
      { id: "a", label: "A", group: "left" },
      { id: "b", label: "B", group: "right" },
    ];
    const laidOut = layoutOnSphere(nodes);
    expect(laidOut).toHaveLength(2);
    expect(laidOut[0]).toMatchObject({ id: "a", label: "A", group: "left" });
    expect(laidOut[1]).toMatchObject({ id: "b", label: "B", group: "right" });
    for (const point of laidOut) {
      expectOnUnitSphere(point);
    }
  });

  it("uses a full-sphere layout for a single group", () => {
    const nodes = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ];
    const laidOut = layoutOnSphere(nodes);
    expect(laidOut).toHaveLength(3);
    for (const point of laidOut) {
      expectOnUnitSphere(point);
    }
  });

  it("assigns distinct wedges to two groups", () => {
    const nodes = [
      { id: "a", label: "A", group: "left" },
      { id: "b", label: "B", group: "right" },
    ];
    const laidOut = layoutOnSphere(nodes);
    const left = laidOut.find((node) => node.id === "a")!;
    const right = laidOut.find((node) => node.id === "b")!;
    const leftLon = longitude(left);
    const rightLon = longitude(right);
    expect(Math.abs(leftLon - rightLon)).toBeGreaterThan(Math.PI / 4);
  });

  it("orders groups by first appearance in the input", () => {
    const nodes = [
      { id: "a", label: "A", group: "beta" },
      { id: "b", label: "B", group: "alpha" },
    ];
    const laidOut = layoutOnSphere(nodes);
    const beta = laidOut.find((node) => node.id === "a")!;
    const alpha = laidOut.find((node) => node.id === "b")!;
    expect(longitude(beta)).toBeLessThan(Math.PI);
    expect(longitude(alpha)).toBeGreaterThanOrEqual(Math.PI);
  });
});

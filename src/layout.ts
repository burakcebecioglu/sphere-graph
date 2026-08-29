import type { Point3D } from "./types";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Evenly distributes `n` points on the unit sphere using a Fibonacci
 * lattice. Guarantees roughly equal nearest-neighbor angular gaps —
 * unlike a force-directed simulation, which collapses a densely
 * cross-linked graph into an unreadable hairball no matter how the
 * charge/collision forces are tuned.
 */
export function fibonacciSphere(n: number): Point3D[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 1, y: 0, z: 0 }];
  const points: Point3D[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return points;
}

/**
 * Like `fibonacciSphere`, but every point's longitude is restricted to one
 * `[start, start + width)` band of the sphere. Used to give each distinct
 * group its own wedge so groups stay visually separable while every node
 * still keeps a real, measurable gap from its neighbors.
 */
export function fibonacciWedge(
  n: number,
  start: number,
  width: number,
  options?: { avoidPoles?: boolean },
): Point3D[] {
  if (n <= 0) return [];
  const points: Point3D[] = [];
  const denom = Math.max(n - 1, 1);
  // When multiple groups each get a wedge, don't place a node on the poles:
  // at y=±1 the radius is 0 so longitude is ignored and groups collide.
  const polePad = options?.avoidPoles ? 0.12 : 0;
  const yTop = 1 - polePad;
  const yBottom = -1 + polePad;
  for (let i = 0; i < n; i++) {
    const y = yTop - (i / denom) * (yTop - yBottom);
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const jitter = ((i * GOLDEN_ANGLE) % width + width) % width;
    const theta = start + jitter;
    points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return points;
}

/**
 * Places every node on the unit sphere. Nodes are grouped by `group` (in
 * order of first appearance) and each group gets an equal-width longitude
 * wedge, packed independently with `fibonacciWedge` — two groups naturally
 * become two hemispheres, three become three lunes, and so on. Nodes
 * without a `group` are treated as one shared group, which degenerates to
 * a single `fibonacciSphere` covering the whole sphere.
 */
export function layoutOnSphere<T extends { id: string; group?: string }>(
  nodes: readonly T[],
): Array<T & Point3D> {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const node of nodes) {
    const key = node.group ?? "";
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(node);
  }

  const groupCount = order.length || 1;
  const wedgeWidth = (Math.PI * 2) / groupCount;
  const out: Array<T & Point3D> = [];

  order.forEach((key, groupIndex) => {
    const groupNodes = buckets.get(key)!;
    const points =
      groupCount === 1
        ? fibonacciSphere(groupNodes.length)
        : fibonacciWedge(groupNodes.length, groupIndex * wedgeWidth, wedgeWidth, {
            avoidPoles: true,
          });
    groupNodes.forEach((node, i) => {
      out.push({ ...node, ...points[i]! });
    });
  });

  return out;
}

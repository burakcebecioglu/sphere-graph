import type { Camera, Point3D, Projected2D } from "./types";

function rotateY(x: number, y: number, z: number, angle: number): Point3D {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c + z * s, y, z: -x * s + z * c };
}

function rotateX(x: number, y: number, z: number, angle: number): Point3D {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x, y: y * c - z * s, z: y * s + z * c };
}

/**
 * Rotates every point by the camera's yaw/pitch, applies a perspective
 * projection, and sorts far-to-near (painter's algorithm) so overlapping
 * nodes composite correctly without a z-buffer. Points behind the camera
 * are dropped.
 */
export function project<T extends Point3D & { id: string }>(
  nodes: readonly T[],
  camera: Camera,
): Array<Projected2D & { source: T }> {
  const cx = camera.width / 2;
  const cy = camera.height / 2;
  const out: Array<Projected2D & { source: T }> = [];

  for (const node of nodes) {
    let p = rotateY(node.x, node.y, node.z, camera.yaw);
    p = rotateX(p.x, p.y, p.z, camera.pitch);
    const depth = p.z + camera.distance;
    if (depth <= 0.2) continue;
    const scale = camera.focal / depth;
    out.push({
      id: node.id,
      x: cx + p.x * scale,
      y: cy - p.y * scale,
      depth,
      // Normalized so node size stays roughly constant across typical zoom.
      scale: camera.distance / depth,
      source: node,
    });
  }

  out.sort((a, b) => b.depth - a.depth);
  return out;
}

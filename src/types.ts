export interface SphereGraphNode {
  /** Stable, unique identifier. */
  id: string;
  /** Text rendered next to the node. */
  label: string;
  /**
   * Optional grouping key. Nodes are laid out one longitude wedge per
   * distinct group — two groups become two hemispheres, three become three
   * lunes, and so on. Nodes without a group all share the full sphere.
   */
  group?: string;
  /**
   * Optional pre-computed importance (e.g. a domain-specific score). When
   * omitted, `SphereGraph` derives it from `edges` (node degree) so more
   * connected nodes render larger.
   */
  weight?: number;
}

export interface SphereGraphEdge {
  source: string;
  target: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Camera {
  /** Rotation around the vertical axis, radians. */
  yaw: number;
  /** Rotation around the horizontal axis, radians. */
  pitch: number;
  /** Distance of the camera from the origin, in the same units as the layout (unit sphere). */
  distance: number;
  /** Output viewport size, in the same units as the returned 2D coordinates. */
  width: number;
  height: number;
  /** Perspective focal length, in output units. */
  focal: number;
}

export interface Projected2D {
  id: string;
  x: number;
  y: number;
  /** Camera-space depth (distance from camera along its view axis); smaller is closer. */
  depth: number;
  /** Perspective scale factor at this depth — use to scale radius/label size so near nodes read larger. */
  scale: number;
}

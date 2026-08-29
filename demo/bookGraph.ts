import type { SphereGraphEdge, SphereGraphNode } from "../src/types";

export const bookGroupLabels: Record<string, string> = {
  ch1: "Chapter 1: Departure",
  ch2: "Chapter 2: Crossing",
  ch3: "Chapter 3: Return",
};

export const bookGroupColors: Record<string, string> = {
  ch1: "#30d158",
  ch2: "#0a84ff",
  ch3: "#bf5af2",
};

export const bookNodes: SphereGraphNode[] = [
  // Chapter 1
  { id: "ch1-open", label: "Opening scene", group: "ch1" },
  { id: "ch1-meet", label: "Meet the guide", group: "ch1" },
  { id: "ch1-storm", label: "The storm", group: "ch1" },
  { id: "ch1-choice", label: "Leave the village", group: "ch1" },
  { id: "ch1-map", label: "Hidden map", group: "ch1" },
  // Chapter 2
  { id: "ch2-arrival", label: "River crossing", group: "ch2" },
  { id: "ch2-secret", label: "Secret council", group: "ch2" },
  { id: "ch2-betrayal", label: "The betrayal", group: "ch2" },
  { id: "ch2-escape", label: "Escape the city", group: "ch2" },
  { id: "ch2-ally", label: "Unexpected ally", group: "ch2" },
  // Chapter 3
  { id: "ch3-reunion", label: "Reunion at dawn", group: "ch3" },
  { id: "ch3-truth", label: "Truth revealed", group: "ch3" },
  { id: "ch3-finale", label: "Final choice", group: "ch3" },
  { id: "ch3-echo", label: "Echo of ch1", group: "ch3" },
];

export const bookEdges: SphereGraphEdge[] = [
  // Chapter 1 — linear spine
  { source: "ch1-open", target: "ch1-meet", kind: "sequential", directed: true },
  { source: "ch1-meet", target: "ch1-storm", kind: "sequential", directed: true },
  { source: "ch1-storm", target: "ch1-choice", kind: "sequential", directed: true },
  { source: "ch1-meet", target: "ch1-map", kind: "sequential", directed: true },
  { source: "ch1-map", target: "ch1-choice", kind: "sequential", directed: true },
  // Chapter 1 — non-linear shortcut
  { source: "ch1-open", target: "ch1-choice", kind: "sequential", directed: true },

  // Chapter 2 — linear spine
  { source: "ch2-arrival", target: "ch2-secret", kind: "sequential", directed: true },
  { source: "ch2-secret", target: "ch2-betrayal", kind: "sequential", directed: true },
  { source: "ch2-betrayal", target: "ch2-escape", kind: "sequential", directed: true },
  { source: "ch2-secret", target: "ch2-ally", kind: "sequential", directed: true },
  { source: "ch2-ally", target: "ch2-escape", kind: "sequential", directed: true },

  // Chapter 3 — linear spine
  { source: "ch3-reunion", target: "ch3-truth", kind: "sequential", directed: true },
  { source: "ch3-truth", target: "ch3-finale", kind: "sequential", directed: true },
  { source: "ch3-reunion", target: "ch3-echo", kind: "sequential", directed: true },
  { source: "ch3-echo", target: "ch3-finale", kind: "sequential", directed: true },

  // Cross-chapter links
  { source: "ch1-choice", target: "ch2-arrival", kind: "sequential", directed: true },
  { source: "ch2-escape", target: "ch3-reunion", kind: "sequential", directed: true },
  { source: "ch3-truth", target: "ch1-meet", kind: "reference", directed: true },
  { source: "ch2-betrayal", target: "ch3-truth", kind: "cause", directed: true },
  { source: "ch1-map", target: "ch2-secret", kind: "reference", directed: true },

  // Legacy undirected tie (default styling)
  { source: "ch2-ally", target: "ch3-echo" },
];
